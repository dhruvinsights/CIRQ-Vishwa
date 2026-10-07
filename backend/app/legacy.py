"""Thin client for the Express domain engine (strangler-fig). Delete as route groups are ported."""
from __future__ import annotations

import httpx

from .config import get_settings
from .errors import ApiError


async def legacy_get(path: str, **params):
    s = get_settings()
    try:
        async with httpx.AsyncClient(base_url=s.legacy_engine_url, timeout=15) as c:
            r = await c.get(f"/api/v1{path}", params=params or None)
    except httpx.HTTPError as exc:
        raise ApiError(502, "LEGACY_ENGINE_DOWN", f"Domain engine unreachable: {exc.__class__.__name__}") from exc
    if r.status_code == 404:
        raise ApiError(404, "NOT_FOUND", f"{path} not found")
    r.raise_for_status()
    return r.json()
