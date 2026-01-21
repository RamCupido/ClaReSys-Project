from fastapi import FastAPI
from src.api.router import router
from src.events.consumer import EventConsumer
from src.infrastructure.redis_client import get_redis_client
from src.middlewares.audit_middleware import audit_middleware
import os
import json
import httpx

ENV = os.getenv("ENV", "development").lower()
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "true").lower() == "true"

if ENV == "production":
    ENABLE_DOCS = False

openapi_tags = [
    {"name": "queries", "description": "Booking query endpoints.",},
]

app = FastAPI(
    title="ClaReSys - Booking Query Service",
    version="1.0.0",
    description="Booking Read Microservice (CQRS): query bookings and related data.",
    openapi_tags=openapi_tags,
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None,
    contact={"name": "ClaReSys Team"},
    license_info={"name": "Internal Use"},
)

app.middleware("http")(audit_middleware)

app.include_router(router, prefix="/api/v1/queries", tags=["queries"])

BOOKING_COMMAND_URL = os.getenv("BOOKING_COMMAND_URL", "http://booking-command:8000")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

async def rehydrate_from_command():
    r = get_redis_client()

    r.delete("bookings:all")
    for k in r.scan_iter(match="booking:*", count=500):
        r.delete(k)
    for k in r.scan_iter(match="user:*:bookings", count=500):
        r.delete(k)
    for k in r.scan_iter(match="classroom:*:bookings", count=500):
        r.delete(k)

    headers = {}
    if INTERNAL_API_KEY:
        headers["X-Internal-API-Key"] = INTERNAL_API_KEY

    limit = 1000
    offset = 0
    total_loaded = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            url = f"{BOOKING_COMMAND_URL}/api/v1/bookings/internal/bookings?limit={limit}&offset={offset}"
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])

            if not items:
                break

            pipe = r.pipeline(transaction=False)

            for doc in items:
                booking_id = doc["booking_id"]
                pipe.set(f"booking:{booking_id}", json.dumps(doc))
                pipe.sadd("bookings:all", booking_id)

                user_id = doc.get("user_id")
                classroom_id = doc.get("classroom_id")
                if user_id:
                    pipe.sadd(f"user:{user_id}:bookings", booking_id)
                if classroom_id:
                    pipe.sadd(f"classroom:{classroom_id}:bookings", booking_id)

            pipe.execute()

            total_loaded += len(items)
            offset += limit

    print(f"[booking-query] Rehydrate completo. Bookings cargados: {total_loaded}")


@app.on_event("startup")
async def startup_event():
    try:
        await rehydrate_from_command()
    except Exception as e:
        print(f"[booking-query] Rehydrate falló: {e}")

    consumer = EventConsumer()
    consumer.start()
    print("[booking-query] Consumidor RabbitMQ activo")


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "booking-query", "env": ENV, "docs": ENABLE_DOCS}
