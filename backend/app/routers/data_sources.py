"""
Data-source registry. Metadata (provider, license, endpoint) is static and public; STATUS is measured.
The old version hardcoded 'LIVE', record counts (4,850,000 ...) and sync times. All removed.
"""
from __future__ import annotations

import asyncio
import time

from fastapi import APIRouter, Depends

from ..auth import user_dep
from ..errors import ApiError
from ..probe import probe

router = APIRouter(prefix="/data")

_SOURCES = [
    {"id": "fao-stat", "name": "FAOSTAT", "provider": "FAO (UN)", "type": "AGRICULTURAL_STATISTICS",
     "coverage": "Global (country level)", "license": "CC BY-NC-SA 3.0 IGO",
     "endpoint": "https://fenixservices.fao.org/faostat/api/v1/en/definitions/types"},
    {"id": "copernicus-s2", "name": "Copernicus Data Space (Sentinel-2)", "provider": "ESA",
     "type": "EARTH_OBSERVATION", "coverage": "Global, 10 m multispectral", "license": "Copernicus Open Access",
     "endpoint": "https://catalogue.dataspace.copernicus.eu/odata/v1/Collections"},
    {"id": "nasa-power", "name": "NASA POWER", "provider": "NASA LaRC", "type": "METEOROLOGY_SOLAR",
     "coverage": "Global", "license": "NASA Open Data Policy",
     "endpoint": "https://power.larc.nasa.gov/"},
    {"id": "agrovoc-thesaurus", "name": "AGROVOC", "provider": "FAO", "type": "CONTROLLED_VOCABULARY",
     "coverage": "Multilingual vocabulary", "license": "CC BY 4.0",
     "endpoint": "https://agrovoc.fao.org/browse/rest/v1/vocabularies"},
    {"id": "wb-pink-sheet", "name": "World Bank Commodity Markets (Pink Sheet)", "provider": "World Bank",
     "type": "MARKET_BENCHMARK", "coverage": "Global commodity prices", "license": "CC BY 4.0",
     "endpoint": "https://www.worldbank.org/en/research/commodity-markets"},
]
_STATE: dict[str, dict] = {}
_TTL_S = 900
_last_refresh = 0.0
_task: asyncio.Task | None = None


def _view(src: dict) -> dict:
    st = _STATE.get(src["id"])
    return {
        **src,
        "records": 0,                        # unknown — we do not guess
        "freshness": f"Reachability checked {st['checkedAt']}" if st else "Not checked yet",
        "qualityScore": 0,                   # no measured quality metric exists yet
        "status": "LIVE" if st and st["ok"] else "STALE",
        "lastSync": st["checkedAt"] if st else "",
        "lastProbe": st,
    }


def _ensure_fresh() -> None:
    """Kick a background refresh when state is older than the TTL (no startup hook needed)."""
    global _task
    if time.time() - _last_refresh > _TTL_S and (_task is None or _task.done()):
        _task = asyncio.create_task(refresh_all())


async def refresh_all() -> None:
    global _last_refresh
    _last_refresh = time.time()
    results = await asyncio.gather(*(probe(s["endpoint"]) for s in _SOURCES))
    for s, r in zip(_SOURCES, results):
        _STATE[s["id"]] = r


def _get(source_id: str) -> dict:
    for s in _SOURCES:
        if s["id"] == source_id:
            return s
    raise ApiError(404, "NOT_FOUND", f"Data source '{source_id}' not found")


@router.get("/sources")
async def list_sources(_=Depends(user_dep)):
    _ensure_fresh()
    items = [_view(s) for s in _SOURCES]
    return {"sources": items, "total": len(items), "status": "LIVE"}


@router.get("/sources/{source_id}")
async def get_source(source_id: str, _=Depends(user_dep)):
    return _view(_get(source_id))


@router.get("/sources/{source_id}/health")
async def source_health(source_id: str, _=Depends(user_dep)):
    src = _get(source_id)
    _STATE[source_id] = await probe(src["endpoint"])
    return {"sourceId": source_id, **_STATE[source_id], "status": "LIVE" if _STATE[source_id]["ok"] else "STALE"}


@router.get("/sources/{source_id}/freshness")
async def source_freshness(source_id: str, _=Depends(user_dep)):
    _get(source_id)
    st = _STATE.get(source_id)
    return {"sourceId": source_id, "lastChecked": st["checkedAt"] if st else None,
            "note": "Reachability only. Dataset publication dates are not tracked yet."}


@router.get("/sources/{source_id}/coverage")
async def source_coverage(source_id: str, _=Depends(user_dep)):
    return {"sourceId": source_id, "coverage": _get(source_id)["coverage"]}


@router.get("/sources/{source_id}/schema")
async def source_schema(source_id: str, _=Depends(user_dep)):
    _get(source_id)
    raise ApiError(501, "NOT_IMPLEMENTED", "Schema introspection is not implemented for this source yet.")
