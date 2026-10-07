"""Direct pass-through to the digital farm API, on behalf of the signed-in person (token exchange)."""
from fastapi import APIRouter, Depends

from ..auth import farm_dep
from ..errors import ApiError

router = APIRouter(prefix="/farm")


@router.get("/{collection}")
async def list_collection(collection: str, farm=Depends(farm_dep)):
    # Collections are the 47 entities of the AgriFoodData model (Farm, Field, Region, ...).
    if not collection.replace("-", "").replace("_", "").isalnum():
        raise ApiError(422, "VALIDATION", "invalid collection name")
    r = await farm.get(f"/{collection}")
    if r.status_code >= 400:
        raise ApiError(r.status_code if r.status_code in (401, 403, 404) else 502, "UPSTREAM",
                       f"Farm API returned HTTP {r.status_code}")
    return r.json()
