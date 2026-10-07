"""
Auth + service-client abstraction.

appext mode -> NaLamKI Application SDK (`pip install appext`): server-side session, __Host- cookie,
               CSRF header, CSP, and token exchange for the farm API (RFC 8693).
dev mode    -> fixed principal and a plain httpx client, so the app runs without an identity provider.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

import httpx

from .config import get_settings
from .errors import NotConfigured

settings = get_settings()

if settings.auth_mode == "dev" and os.getenv("APP_ENV") == "production":
    raise RuntimeError("AUTH_MODE=dev is not allowed when APP_ENV=production")


@dataclass
class DevUser:
    sub: str = "dev-user"
    roles: set[str] = field(default_factory=lambda: {"admin"})


class DevServiceClient:
    """Mimics the part of appext.ServiceClient we use: .get/.post below a fixed base URL."""

    def __init__(self, base_url: str, token: str):
        self._base = base_url.rstrip("/")
        self._headers = {"Authorization": f"Bearer {token}"} if token else {}

    def _require(self) -> None:  # checked on use, so routes that never call the farm API still work
        if not self._base:
            raise NotConfigured("The digital farm API", "Set FARM_API_BASE_URL (ask your platform operator).")

    async def get(self, path: str, **kw) -> httpx.Response:
        self._require()
        async with httpx.AsyncClient(timeout=20) as c:
            return await c.get(self._base + path, headers=self._headers, **kw)

    async def post(self, path: str, **kw) -> httpx.Response:
        self._require()
        async with httpx.AsyncClient(timeout=20) as c:
            return await c.post(self._base + path, headers=self._headers, **kw)


ext = None  # appext.Extension or None
if settings.auth_mode == "appext":
    from appext import Extension  # noqa: WPS433  (optional dependency)

    ext = Extension.from_manifest(settings.manifest_path)


async def _dev_user() -> DevUser:
    return DevUser()


async def _dev_farm() -> DevServiceClient:
    return DevServiceClient(settings.farm_api_base_url, settings.farm_api_token)


# FastAPI dependencies used by every router
user_dep = ext.current_user if ext else _dev_user
farm_dep = ext.service("farm") if ext else _dev_farm
