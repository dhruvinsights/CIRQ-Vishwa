"""Reachability probing. Reports what was actually measured; says nothing about data freshness."""
from __future__ import annotations

import time
from datetime import datetime, timezone

import httpx


async def probe(url: str, timeout: float = 8.0) -> dict:
    t0 = time.perf_counter()
    now = datetime.now(timezone.utc).isoformat()
    if not url:
        return {"ok": False, "latencyMs": 0, "httpStatus": None, "error": "no endpoint configured", "checkedAt": now}
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as c:
            r = await c.get(url)
        ms = int((time.perf_counter() - t0) * 1000)
        # <500 = the host answered. A 404 on a bare API root still proves the service is up.
        return {"ok": r.status_code < 500, "latencyMs": ms, "httpStatus": r.status_code, "error": None, "checkedAt": now}
    except httpx.HTTPError as exc:
        return {"ok": False, "latencyMs": int((time.perf_counter() - t0) * 1000), "httpStatus": None,
                "error": exc.__class__.__name__, "checkedAt": now}
