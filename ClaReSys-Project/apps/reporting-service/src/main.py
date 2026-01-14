from fastapi import FastAPI
from src.routes.router import router

app = FastAPI(title="Reporting Service")

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Reporting Service"}
