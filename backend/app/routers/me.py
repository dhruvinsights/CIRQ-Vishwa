from fastapi import APIRouter, Depends

from ..auth import user_dep

router = APIRouter()


@router.get("/me")
async def me(user=Depends(user_dep)):
    return {"sub": user.sub, "roles": sorted(user.roles)}
