from fastapi import FastAPI
from src.config.database import engine, Base
from src.routes.router import router
from common.logger import get_logger

# Inicializamos el logger con el nombre del servicio
logger = get_logger("classroom-service")

# Crear las tablas automáticamente al iniciar (solo para desarrollo local)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Classroom Service", version="1.0.0")

app.include_router(router, prefix="/api/v1/classrooms", tags=["classrooms"])

@app.on_event("startup")
async def startup_event():
    logger.info("Classroom Service is starting up...")

@app.get("/health")
def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "ok", "service": "classroom-service"}