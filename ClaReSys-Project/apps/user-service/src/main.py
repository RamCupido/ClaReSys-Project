import threading
from fastapi import FastAPI
from src.config.database import engine, Base
from src.api.router import router
from src.grpc.server import serve_grpc
from common.logger import get_logger

logger = get_logger("user-service")

app = FastAPI(title="User Service", version="1.0.0")

app.include_router(router, prefix="/api/v1/users", tags=["users"])

@app.on_event("startup")
def startup_event():
    logger.info("Starting up User Service...")
    grpc_thread = threading.Thread(target=serve_grpc, daemon=True)
    grpc_thread.start()

@app.get("/health")
def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "ok", "service": "user-service"}