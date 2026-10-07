"""Knowledge endpoints backed by Db2 vector search. No fabricated citation counts."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth import user_dep
from ..config import get_settings
from ..errors import ApiError
from ..legacy import legacy_get
from ..rag import ingest, store

router = APIRouter(prefix="/knowledge")


def _article(doc, dist: float) -> dict:
    m = doc.metadata
    return {
        "id": f"{m.get('source', 'doc')}#{m.get('chunk', 0)}",
        "title": m.get("title") or m.get("source") or "Untitled",
        "source": m.get("publisher") or m.get("source") or "",
        "publicationDate": "",
        "resource": "", "process": "", "conditions": "", "geography": "",
        "output": doc.page_content[:600],
        "citation": m.get("url") or m.get("source") or "",
        "doi": m.get("doi") or None,
        "confidence": round(max(0.0, 1.0 - float(dist)) * 100, 1),
        "verified": bool(m.get("verified", False)),
    }


async def _search(q: str) -> dict:
    s = get_settings()
    if not q.strip():
        return {"articles": [], "count": 0, "status": "LIVE", "hint": "Enter a query to search the knowledge base."}
    hits = await store.search(q, s.rag_top_k)
    arts = [_article(d, dist) for d, dist in hits if dist <= s.rag_max_distance]
    return {"articles": arts, "count": len(arts), "status": "LIVE"}


@router.get("/search")
async def search(q: str = "", _=Depends(user_dep)):
    return await _search(q)


@router.get("/resources/{resource_id}")
async def for_resource(resource_id: str, _=Depends(user_dep)):
    res = await legacy_get(f"/resources/{resource_id}")
    return {"resourceId": resource_id, **await _search(res.get("name", ""))}


@router.get("/pathways/{pathway_id}")
async def for_pathway(pathway_id: str, _=Depends(user_dep)):
    pw = await legacy_get(f"/pathways/{pathway_id}")
    return {"pathwayId": pathway_id, **await _search(f"{pw.get('name', '')} {pw.get('primaryTechnology', '')}")}


@router.get("/sources/{source_id}")
async def source(source_id: str, _=Depends(user_dep)):
    # Citation counts per source are not tracked yet; report that instead of inventing a number.
    return {"sourceId": source_id, "citationsCount": None, "peerReviewed": None, "publisher": None, "status": "STALE"}


@router.post("/ingest")
async def run_ingest(user=Depends(user_dep)):
    if "admin" not in user.roles:
        raise ApiError(403, "FORBIDDEN", "Admin role required")
    return await ingest.ingest_dir(get_settings().corpus_dir)
