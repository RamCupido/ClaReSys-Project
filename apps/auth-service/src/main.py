import os
from fastapi import FastAPI
from src.routes.auth import router
from common.logger import get_logger
from src.middlewares.audit_middleware import audit_middleware

logger = get_logger("auth-service")

ENV = os.getenv("ENV", "development").lower()
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "true").lower() == "true"

if ENV == "production":
    ENABLE_DOCS = False

openapi_tags = [
    {"name": "auth", "description": "Authentication and authorization endpoints."},
]

app = FastAPI(
    title="ClsReSys - Auth Service",
    version="1.0.0",
    description="Authentication and Authorization Microservice.",
    openapi_tags=openapi_tags,
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None,
    contact={"name": "ClaReSys Team"},
    license_info={"name": "Internal Use"},
)

app.middleware("http")(audit_middleware)

app.include_router(router, prefix="/api/v1/auth", tags=["auth"])

@app.on_event("startup")
async def startup_event():
    logger.info("Auth Service is starting up...")

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "auth-service", "env": ENV, "docs": ENABLE_DOCS}
