from fastapi import FastAPI
from src.api.router import router
from src.events.consumer import EventConsumer
import time

app = FastAPI(title="Booking Query Service (Redis)", version="1.0.0")

app.include_router(router, prefix="/api/v1/queries", tags=["queries"])

@app.on_event("startup")
async def startup_event():
    # Wait a moment to ensure RabbitMQ is up (in real scenarios, implement retries)
    consumer = EventConsumer()
    consumer.start()
    print("Query Service iniciado y consumidor activo")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "booking-query"}