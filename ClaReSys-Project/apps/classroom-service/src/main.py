import os
from fastapi import FastAPI
from src.routes.router import router
from common.logger import get_logger

logger = get_logger("classroom-service")

ENV = os.getenv("ENV", "development").lower()
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "true").lower() == "true"

# Disable docs in production by default
if ENV == "production":
    ENABLE_DOCS = False

openapi_tags = [
    {
        "name": "classrooms",
        "description": "Operaciones para gestionar aulas (CRUD, filtros).",
    },
]

app = FastAPI(
    title="ClaReSys - Classroom Service",
    version="1.0.0",
    description="Microservicio responsable de la gestión de aulas (creación, consulta, actualización y eliminación).",
    openapi_tags=openapi_tags,
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None,
    contact={
        "name": "ClaReSys Team",
    },
    license_info={
        "name": "Internal Use",
    },
)

app.include_router(router, prefix="/api/v1/classrooms", tags=["classrooms"])

@app.on_event("startup")
async def startup_event():
    logger.info("Classroom Service is starting up...")

@app.get("/health", tags=["health"])
def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "ok", "service": "classroom-service", "env": ENV, "docs": ENABLE_DOCS}
