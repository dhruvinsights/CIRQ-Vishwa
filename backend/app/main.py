"""
CIRQ backend entrypoint.

  /api/v1/*   session-protected API (new Python routes first, then the Express domain engine as fallback)
  /healthz /readyz   public
  /auth/*  /_sdk/*   added by the Application SDK in appext mode
  /*          built frontend (dist/)
"""
from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles

from .auth import ext
from .config import get_settings
from .errors import ApiError, api_error_handler
from .routers import ai, data_sources, farm, health, integrations, knowledge, me, search_nl, settings_router

log = logging.getLogger("cirq")
settings = get_settings()

# ---- the protected API router -------------------------------------------------------------------------
api: APIRouter = ext.router(prefix="/api/v1") if ext else APIRouter(prefix="/api/v1")
for r in (health.router, me.router, ai.router, knowledge.router, search_nl.router,
          integrations.router, data_sources.router, farm.router, settings_router.router):
    api.include_router(r)

_HOP = {"host", "content-length", "connection", "transfer-encoding", "cookie", "authorization"}


@api.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], include_in_schema=False)
async def legacy_proxy(path: str, request: Request) -> Response:
    """Strangler-fig: anything not ported to Python yet is served by the Express domain engine.
    Cookies and Authorization are NOT forwarded; the engine listens on 127.0.0.1 only."""
    headers = {k: v for k, v in request.headers.items() if k.lower() not in _HOP}
    try:
        async with httpx.AsyncClient(base_url=settings.legacy_engine_url, timeout=30) as c:
            up = await c.request(request.method, f"/api/v1/{path}", params=request.query_params,
                                 content=await request.body(), headers=headers)
    except httpx.HTTPError as exc:
        raise ApiError(502, "LEGACY_ENGINE_DOWN", f"Domain engine unreachable: {exc.__class__.__name__}") from exc
    drop = {"content-encoding", "content-length", "transfer-encoding", "connection"}
    return Response(up.content, up.status_code,
                    {k: v for k, v in up.headers.items() if k.lower() not in drop})


# ---- app assembly ---------------------------------------------------------------------------------------
if ext:
    app = ext.asgi(static_dir=settings.static_dir)      # SDK: sessions, CSRF, CSP, /auth, /_sdk
else:
    app = FastAPI(title="CIRQ")
    app.include_router(api)

app.include_router(health.public)
app.add_exception_handler(ApiError, api_error_handler)

if not ext:
    from pathlib import Path
    if Path(settings.static_dir).is_dir():
        app.mount("/", StaticFiles(directory=settings.static_dir, html=True), name="static")
