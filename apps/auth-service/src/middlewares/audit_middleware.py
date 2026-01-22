from datetime import datetime, timezone
from fastapi import Request
from src.audit.producer import emit_audit_event

SERVICE_NAME = "auth-service"

EXCLUDE_PREFIXES = (
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/auth/login",
)

async def audit_middleware(request: Request, call_next):
    response = await call_next(request)

    path = request.url.path
    if path.startswith(EXCLUDE_PREFIXES):
        return response

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": SERVICE_NAME,
        "method": request.method,
        "path": path,
        "status_code": response.status_code,
        "correlation_id": request.headers.get("x-request-id"),
        "ip": request.headers.get("x-forwarded-for"),
        "actor_user_id": request.headers.get("x-user-id"),
        "actor_role": request.headers.get("x-user-role"),
    }

    try:
        emit_audit_event(event)
    except Exception:
        pass

    return response
