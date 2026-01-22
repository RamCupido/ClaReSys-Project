import os
import threading
from fastapi import FastAPI
from src.api.router import router
from src.grpc.server import serve_grpc
from common.logger import get_logger
from src.middlewares.audit_middleware import audit_middleware

logger = get_logger("user-service")

ENV = os.getenv("ENV", "development").lower()
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "true").lower() == "true"

if ENV == "production":
    ENABLE_DOCS = False

openapi_tags = [
    {"name": "users", "description": "Operations for managing users (CRUD, status, roles)."},
]

app = FastAPI(
    title="ClaReSys - User Service",
    version="1.0.0",
    description="Microservice responsible for managing users (registration, retrieval, updating, and deletion).",
    openapi_tags=openapi_tags,
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None,
    contact={"name": "ClaReSys Team"},
    license_info={"name": "Internal Use"},
)

app.middleware("http")(audit_middleware)

app.include_router(router, prefix="/api/v1/users", tags=["users"])

@app.on_event("startup")
def startup_event():
    logger.info("Starting up User Service...")
    grpc_thread = threading.Thread(target=serve_grpc, daemon=True)
    grpc_thread.start()

@app.get("/health", tags=["health"])
def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "ok", "service": "user-service", "env": ENV, "docs": ENABLE_DOCS}
