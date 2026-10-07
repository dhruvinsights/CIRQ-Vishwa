"""
Real AI services. Replaces the old Express stubs that always returned COMPLETED / confidence 95.

Execution history is an in-memory ring buffer (one replica). Persisting it to Db2 is TODO P1.
"""
from __future__ import annotations

import time
import uuid
from collections import deque
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import user_dep
from ..config import get_settings
from ..errors import ApiError
from ..rag import chain

router = APIRouter(prefix="/ai")

_EXECUTIONS: deque[dict] = deque(maxlen=500)

SERVICES = [
    {
        "id": "srv-knowledge-assistant",
        "name": "Knowledge Assistant (RAG)",
        "category": "Retrieval-Augmented Generation",
        "version": "1.0.0",
        "description": "Answers circular-bioeconomy questions strictly from the Db2 knowledge base, with citations. "
                       "Refuses to answer when evidence is missing.",
        "schema": {
            "type": "object",
            "properties": {
                "question": {"type": "string", "title": "Question",
                             "description": "e.g. What biochar yield is reported for rice straw at 500 C?"},
                "topK": {"type": "number", "title": "Evidence chunks", "default": 5},
            },
            "required": ["question"],
        },
    },
    {
        "id": "srv-semantic-resolver",
        "name": "Resource Semantic Concept Resolver",
        "category": "Ontology & Semantic Normalization",
        "version": "1.0.0",
        "description": "Resolves a raw crop/by-product term to AGROVOC concepts using FAO's public AGROVOC REST API.",
        "schema": {
            "type": "object",
            "properties": {
                "rawTerm": {"type": "string", "title": "Raw Biomass Term",
                            "description": "e.g. rice straw, bagasse, cascara"},
                "locale": {"type": "string", "title": "Source Locale", "default": "en"},
            },
            "required": ["rawTerm"],
        },
    },
]


def _service(service_id: str) -> dict:
    for s in SERVICES:
        if s["id"] == service_id:
            return s
    raise ApiError(404, "NOT_FOUND", f"AI Service '{service_id}' not found")


def _stats(service_id: str) -> tuple[int, int]:
    done = [e for e in _EXECUTIONS if e["serviceId"] == service_id and e["status"] == "COMPLETED"]
    avg = int(sum(e["durationMs"] for e in done) / len(done)) if done else 0
    return len([e for e in _EXECUTIONS if e["serviceId"] == service_id]), avg


def _public(s: dict) -> dict:
    count, avg = _stats(s["id"])
    return {**s, "health": "HEALTHY", "avgLatencyMs": avg, "executionsCount": count}


async def _run_knowledge(payload: dict) -> dict:
    q = str(payload.get("question", "")).strip()
    if not q:
        raise ApiError(422, "VALIDATION", "question is required")
    r = await chain.answer(q, int(payload.get("topK") or 0) or None)
    return {
        "status": "COMPLETED", "confidence": r.confidence, "durationMs": r.duration_ms,
        "outputRef": r.answer, "trace": r.trace,
        "dataSources": sorted({c["title"] for c in r.citations if c.get("title")}) or ["Db2 knowledge base"],
        "data": {"citations": r.citations, "ragStatus": r.status},
    }


async def _run_resolver(payload: dict) -> dict:
    term = str(payload.get("rawTerm", "")).strip()
    lang = str(payload.get("locale") or "en")
    if not term:
        raise ApiError(422, "VALIDATION", "rawTerm is required")
    t0 = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get("https://agrovoc.fao.org/browse/rest/v1/search",
                            params={"query": f"{term}*", "lang": lang, "vocab": "agrovoc"})
            r.raise_for_status()
    except httpx.HTTPError as exc:
        raise ApiError(502, "UPSTREAM", f"AGROVOC unreachable: {exc.__class__.__name__}") from exc
    ms = int((time.perf_counter() - t0) * 1000)
    results = r.json().get("results", [])[:5]
    concepts = [{"uri": x.get("uri"), "label": x.get("prefLabel"), "lang": x.get("lang")} for x in results]
    exact = any((c["label"] or "").lower() == term.lower() for c in concepts)
    # match-type heuristic (documented): exact label 100, prefix hit 60, none 0 — not an ML confidence.
    conf = 100.0 if exact else (60.0 if concepts else 0.0)
    out = (f"{concepts[0]['label']} ({concepts[0]['uri']})" if concepts else f"No AGROVOC concept for '{term}'")
    return {
        "status": "COMPLETED", "confidence": conf, "durationMs": ms, "outputRef": out,
        "dataSources": ["AGROVOC REST API (FAO)"],
        "trace": [{"step": "AGROVOC /search", "durationMs": ms, "status": "OK" if concepts else "EMPTY"}],
        "data": {"concepts": concepts},
    }


_RUNNERS = {"srv-knowledge-assistant": _run_knowledge, "srv-semantic-resolver": _run_resolver}


@router.get("/services")
async def list_services(_=Depends(user_dep)):
    items = [_public(s) for s in SERVICES]
    return {"services": items, "count": len(items), "status": "LIVE"}


@router.get("/services/{service_id}")
async def get_service(service_id: str, _=Depends(user_dep)):
    return _public(_service(service_id))


@router.get("/services/{service_id}/health")
async def service_health(service_id: str, _=Depends(user_dep)):
    s = _public(_service(service_id))
    return {"serviceId": service_id, "health": s["health"], "avgLatencyMs": s["avgLatencyMs"], "status": "LIVE"}


@router.get("/services/{service_id}/schema")
async def service_schema(service_id: str, _=Depends(user_dep)):
    return _service(service_id)["schema"]


@router.get("/services/{service_id}/executions")
async def service_executions(service_id: str, _=Depends(user_dep)):
    _service(service_id)
    return {"executions": [e for e in _EXECUTIONS if e["serviceId"] == service_id]}


@router.post("/services/{service_id}/execute", status_code=201)
async def execute(service_id: str, payload: dict, user=Depends(user_dep)):
    _service(service_id)
    started = datetime.now(timezone.utc).isoformat()
    try:
        res = await _RUNNERS[service_id](payload)
        record = {"status": res["status"], "durationMs": res["durationMs"], "confidence": res["confidence"],
                  "outputRef": res["outputRef"], "dataSources": res["dataSources"], "trace": res["trace"],
                  "data": res["data"]}
    except ApiError as exc:
        record = {"status": "FAILED", "durationMs": 0, "confidence": 0, "outputRef": f"{exc.code}: {exc.message}",
                  "dataSources": [], "trace": [{"step": "execute", "durationMs": 0, "status": "ERROR"}], "data": {}}
        _EXECUTIONS.appendleft({"id": f"exec-{uuid.uuid4().hex[:10]}", "serviceId": service_id,
                                "inputRef": str(payload)[:120], "createdAt": started, "requestedBy": user.sub, **record})
        raise
    entry = {"id": f"exec-{uuid.uuid4().hex[:10]}", "serviceId": service_id,
             "inputRef": str(payload)[:120], "createdAt": started, "requestedBy": user.sub, **record}
    _EXECUTIONS.appendleft(entry)
    return entry


def _execution(execution_id: str) -> dict:
    for e in _EXECUTIONS:
        if e["id"] == execution_id:
            return e
    raise ApiError(404, "NOT_FOUND", f"AI Execution '{execution_id}' not found")


@router.get("/executions")
async def executions(_=Depends(user_dep)):
    return {"executions": list(_EXECUTIONS), "total": len(_EXECUTIONS)}


@router.get("/executions/{execution_id}")
async def execution(execution_id: str, _=Depends(user_dep)):
    return _execution(execution_id)


@router.get("/executions/{execution_id}/status")
async def execution_status(execution_id: str, _=Depends(user_dep)):
    return {"executionId": execution_id, "status": _execution(execution_id)["status"]}


@router.get("/executions/{execution_id}/trace")
async def execution_trace(execution_id: str, _=Depends(user_dep)):
    e = _execution(execution_id)
    return {k: e[k] for k in ("serviceId", "durationMs", "confidence", "trace", "dataSources", "status")} | {
        "executionId": e["id"]}


@router.get("/executions/{execution_id}/result")
async def execution_result(execution_id: str, _=Depends(user_dep)):
    e = _execution(execution_id)
    return {"executionId": e["id"], "output": e["outputRef"], "confidence": e["confidence"], "data": e.get("data", {})}


@router.post("/executions/{execution_id}/cancel")
async def cancel(execution_id: str, _=Depends(user_dep)):
    e = _execution(execution_id)
    if e["status"] in ("COMPLETED", "FAILED"):
        raise HTTPException(409, "Execution already finished")
    e["status"] = "CANCELLED"
    return {"executionId": e["id"], "status": "CANCELLED"}


class AskBody(BaseModel):
    question: str
    topK: int | None = None


@router.post("/ask")
async def ask(body: AskBody, _=Depends(user_dep)):
    """Direct RAG endpoint for the Knowledge Assistant panel (no execution bookkeeping)."""
    r = await chain.answer(body.question, body.topK)
    return {"status": r.status, "answer": r.answer, "citations": r.citations, "trace": r.trace,
            "confidence": r.confidence, "durationMs": r.duration_ms}
