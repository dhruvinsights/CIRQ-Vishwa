import asyncio
import json
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from ..auth import user_dep  # noqa: F401
from ..config import get_settings
from ..rag import store

_STARTED = time.time()
public = APIRouter()
router = APIRouter()


@public.get("/healthz")
async def healthz():
    return {"status": "ok"}


@public.get("/readyz")
async def readyz():
    s = get_settings()
    return {
        "status": "ready",
        "checks": {
            "vectorStore": s.vector_store,
            "vectorStoreConfigured": s.vector_store_configured,
            "db2": s.db2_configured,
            "llm": s.llm_configured,
            "farmApi": bool(s.farm_api_base_url),
        },
    }


@router.get("/health")
async def health():
    return {"status": "UP", "service": "cirq-backend", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/health/live")
async def live():
    return {"status": "UP", "uptimeSeconds": int(time.time() - _STARTED)}


@router.get("/health/ready")
async def ready():
    s = get_settings()

    # Probe vector store chunk count
    chunks = None
    vector_store_status = "NOT_CONFIGURED"
    if s.llm_configured and s.vector_store_configured:
        try:
            chunks = await store.count()
            vector_store_status = f"{s.vector_store.upper()}:OK"
        except Exception as exc:  # noqa: BLE001
            vector_store_status = f"{s.vector_store.upper()}:ERROR:{type(exc).__name__}"

    checks = {
        "vectorStore": vector_store_status,
        "vectorStoreBackend": s.vector_store,
        "llm": f"{s.llm_provider}:CONFIGURED" if s.llm_configured else "NOT_CONFIGURED",
        "farmApi": "CONFIGURED" if s.farm_api_base_url else "NOT_CONFIGURED",
        "ragChunks": str(chunks) if chunks is not None else "UNKNOWN",
        "uptimeSeconds": int(time.time() - _STARTED),
    }
    overall = "UP" if "ERROR" not in vector_store_status else "DEGRADED"
    return {"status": overall, "checks": checks}


@router.get("/system/events")
async def system_events(_=Depends(user_dep)):
    """Recent system events — real entries added as operations occur. Stub list until event log is persisted."""
    return {
        "events": [
            {"id": "ev-boot", "type": "SYSTEM_STARTED", "message": "CIRQ backend started",
             "timestamp": datetime.fromtimestamp(_STARTED, tz=timezone.utc).isoformat(), "status": "LIVE"},
        ]
    }


async def _sse_generator(request: Request):
    """Native Python SSE — sends a heartbeat every 10 s. No proxy needed."""
    while not await request.is_disconnected():
        payload = json.dumps({
            "id": f"ev-{int(time.time())}",
            "type": "TELEMETRY_HEARTBEAT",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptimeSeconds": int(time.time() - _STARTED),
            "queueDepth": 0,
            "throughput": "0.0",
        })
        yield f"data: {payload}\n\n"
        await asyncio.sleep(10)


@router.get("/system/events/stream")
async def events_stream(request: Request, _=Depends(user_dep)):
    """Native SSE endpoint — bypasses the Express proxy which cannot stream."""
    return StreamingResponse(_sse_generator(request), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
