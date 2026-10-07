"""Error envelope the frontend client already understands: {error: {code, message, requestId}}."""
from fastapi import Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message


class NotConfigured(ApiError):
    """A dependency (Db2, LLM, farm API) has no credentials. Say so; never fake a result."""

    def __init__(self, what: str, hint: str):
        super().__init__(503, "NOT_CONFIGURED", f"{what} is not configured. {hint}")


def envelope(request: Request, status: int, code: str, message: str) -> JSONResponse:
    rid = request.headers.get("x-request-id", "")
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message, "requestId": rid}},
        headers={"X-Request-Id": rid} if rid else None,
    )


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    return envelope(request, exc.status, exc.code, exc.message)
