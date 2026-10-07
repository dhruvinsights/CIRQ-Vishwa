"""
Integration connectors. `test` really calls the endpoint; `sync` really pulls from the farm API.
Connectors without a real sync return 501 instead of inventing 'newRecords: 48'.
In-memory registry (one replica): persisting it to Db2 is TODO P1.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from ..auth import farm_dep, user_dep
from ..config import get_settings
from ..errors import ApiError
from ..probe import probe

router = APIRouter(prefix="/integrations")


def _seed() -> dict[str, dict]:
    s = get_settings()
    base = dict(status="STALE", latencyMs=0, recordsCount=0, errorRate=0, lastSync="")
    items = [
        {**base, "id": "int-agrifood-farm", "name": "AgriFoodData Digital Farm API", "service": "AgriFoodData",
         "endpoint": s.farm_api_base_url, "license": "See platform terms", "kind": "farm"},
        {**base, "id": "int-sensorthings", "name": "OGC SensorThings API", "service": "AgriFoodData STA",
         "endpoint": os.getenv("STA_BASE_URL", ""), "license": "OGC Open Standard", "kind": "probe"},
        {**base, "id": "int-copernicus", "name": "Copernicus Data Space", "service": "ESA Sentinel",
         "endpoint": "https://catalogue.dataspace.copernicus.eu/odata/v1/Collections", "license": "Open Access",
         "kind": "probe"},
    ]
    return {i["id"]: i for i in items}


_REG: dict[str, dict] = _seed()


def _get(iid: str) -> dict:
    if iid not in _REG:
        raise ApiError(404, "NOT_FOUND", f"Integration '{iid}' not found")
    return _REG[iid]


def _public(i: dict) -> dict:
    return {k: v for k, v in i.items() if k != "kind"}


@router.get("")
async def list_integrations(_=Depends(user_dep)):
    items = [_public(i) for i in _REG.values()]
    return {"integrations": items, "total": len(items), "status": "LIVE"}


@router.get("/{iid}")
async def get_integration(iid: str, _=Depends(user_dep)):
    return _public(_get(iid))


@router.post("", status_code=201)
async def create(body: dict, _=Depends(user_dep)):
    iid = f"int-{uuid.uuid4().hex[:8]}"
    rec = {"status": "STALE", "latencyMs": 0, "recordsCount": 0, "errorRate": 0, "lastSync": "",
           "license": "", "kind": "probe", **{k: body[k] for k in ("name", "service", "endpoint", "license") if k in body},
           "id": iid}
    for req in ("name", "service", "endpoint"):
        if not rec.get(req):
            raise ApiError(422, "VALIDATION", f"{req} is required")
    _REG[iid] = rec
    return _public(rec)


@router.patch("/{iid}")
async def update(iid: str, body: dict, _=Depends(user_dep)):
    rec = _get(iid)
    for k in ("name", "service", "endpoint", "license"):
        if k in body:
            rec[k] = body[k]
    return _public(rec)


@router.delete("/{iid}")
async def delete(iid: str, _=Depends(user_dep)):
    _get(iid)
    del _REG[iid]
    return {"success": True, "deletedId": iid}


@router.post("/{iid}/test")
async def test(iid: str, farm=Depends(farm_dep)):
    rec = _get(iid)
    if rec["kind"] == "farm":
        import time
        t0 = time.perf_counter()
        try:
            r = await farm.get("/farms")
            ok, code = r.status_code < 400, r.status_code
        except Exception as exc:  # noqa: BLE001 — surface the real reason
            raise ApiError(502, "UPSTREAM", f"Farm API call failed: {exc.__class__.__name__}") from exc
        res = {"ok": ok, "latencyMs": int((time.perf_counter() - t0) * 1000), "httpStatus": code}
    else:
        res = await probe(rec["endpoint"])
    rec["latencyMs"] = res["latencyMs"]
    rec["status"] = "LIVE" if res["ok"] else "ERROR"
    return {"integrationId": iid, "tested": True, "latencyMs": res["latencyMs"],
            "status": "OK" if res["ok"] else "ERROR", "httpStatus": res.get("httpStatus"), "error": res.get("error")}


@router.post("/{iid}/sync")
async def sync(iid: str, farm=Depends(farm_dep)):
    rec = _get(iid)
    if rec["kind"] != "farm":
        raise ApiError(501, "NOT_IMPLEMENTED", f"Sync is not implemented for '{rec['name']}' yet.")
    r = await farm.get("/farms")
    if r.status_code >= 400:
        raise ApiError(502, "UPSTREAM", f"Farm API returned HTTP {r.status_code}")
    body = r.json()
    items = body if isinstance(body, list) else body.get("items") or body.get("data") or body.get("features") or []
    before = rec["recordsCount"]
    rec["recordsCount"] = len(items)
    rec["lastSync"] = datetime.now(timezone.utc).isoformat()
    rec["status"] = "LIVE"
    return {"integrationId": iid, "synced": True, "newRecords": max(0, len(items) - before),
            "lastSync": rec["lastSync"]}


@router.get("/{iid}/logs")
async def logs(iid: str, _=Depends(user_dep)):
    _get(iid)
    return {"logs": [], "note": "Structured sync logs are not persisted yet (TODO P1)."}
