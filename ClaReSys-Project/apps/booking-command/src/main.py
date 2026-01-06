from fastapi import FastAPI
from src.infrastructure.database import engine, Base
from src.api.router import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Booking Command Service", version="1.0.0")

app.include_router(router, prefix="/api/v1/bookings", tags=["bookings"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "booking-command"}