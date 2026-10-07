import time
from datetime import datetime, timezone

from fastapi import APIRouter

from ..auth import user_dep  # noqa: F401  (kept for symmetry; health endpoints are public)
from ..config import get_settings
from ..rag import store

_STARTED = time.time()
public = APIRouter()   # mounted OUTSIDE the session-protected router
router = APIRouter()   # mounted INSIDE (needs a session)


@public.get("/healthz")
async def healthz():
    return {"status": "ok"}


@public.get("/readyz")
async def readyz():
    s = get_settings()
    return {"status": "ready", "checks": {"db2": s.db2_configured, "llm": s.llm_configured,
                                         "farmApi": bool(s.farm_api_base_url)}}


@router.get("/health")
async def health():
    return {"status": "UP", "service": "cirq-backend", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/health/live")
async def live():
    return {"status": "UP", "uptimeSeconds": int(time.time() - _STARTED)}


@router.get("/health/ready")
async def ready():
    s = get_settings()
    chunks = await store.count() if s.db2_configured and s.llm_configured else None
    checks = {
        "db2": "CONFIGURED" if s.db2_configured else "NOT_CONFIGURED",
        "llm": f"{s.llm_provider}:CONFIGURED" if s.llm_configured else "NOT_CONFIGURED",
        "farmApi": "CONFIGURED" if s.farm_api_base_url else "NOT_CONFIGURED",
        "ragChunks": str(chunks) if chunks is not None else "UNKNOWN",
    }
    return {"status": "UP", "checks": checks}
