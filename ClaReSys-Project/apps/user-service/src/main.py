import threading
import asyncio
from fastapi import FastAPI
from src.config.database import engine, Base
from src.api.router import router
from src.grpc.server import serve_grpc

Base.metadata.create_all(bind=engine)

app = FastAPI(title="User Service", version="1.0.0")
app.include_router(router, prefix="/api/v1/users", tags=["users"])

@app.on_event("startup")
def startup_event():
    # Iniciar gRPC en segundo plano
    grpc_thread = threading.Thread(target=serve_grpc, daemon=True)
    grpc_thread.start()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "user-service"}