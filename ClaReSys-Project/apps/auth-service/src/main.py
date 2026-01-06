from fastapi import FastAPI
from src.routes.auth import router

app = FastAPI(title="Auth Service", version="1.0.0")

app.include_router(router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auth-service"}