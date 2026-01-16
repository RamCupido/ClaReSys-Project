import os
from fastapi import FastAPI
from src.routes.auth import router

ENV = os.getenv("ENV", "development").lower()
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "true").lower() == "true"

if ENV == "production":
    ENABLE_DOCS = False

openapi_tags = [
    {"name": "auth", "description": "Authentication and authorization endpoints."},
    {"name": "health", "description": "Health status of the service."},
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

app.include_router(router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "auth-service", "env": ENV, "docs": ENABLE_DOCS}