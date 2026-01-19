from fastapi import FastAPI
from src.routes.router import router

app = FastAPI(title="maintenance-service")

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "maintenance-service"}
