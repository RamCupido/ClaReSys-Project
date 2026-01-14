from fastapi import FastAPI
from src.api.router import router
from src.events.consumer import EventConsumer
from src.infrastructure.redis_client import get_redis_client
import os
import json
import httpx

app = FastAPI(title="Booking Query Service (Redis)", version="1.0.0")

app.include_router(router, prefix="/api/v1/queries", tags=["queries"])

BOOKING_COMMAND_URL = os.getenv("BOOKING_COMMAND_URL", "http://booking-command:8000")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

async def rehydrate_from_command():
    r = get_redis_client()

    # 1) Limpieza mínima de índices (recomendado para evitar duplicados o basura)
    # Borra sets de índices
    r.delete("bookings:all")
    # Borra llaves booking:*
    for k in r.scan_iter(match="booking:*", count=500):
        r.delete(k)
    # Si manejas índices por usuario/aula, puedes limpiar también:
    for k in r.scan_iter(match="user:*:bookings", count=500):
        r.delete(k)
    for k in r.scan_iter(match="classroom:*:bookings", count=500):
        r.delete(k)

    # 2) Pull paginado desde command (por si hay muchas reservas)
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
    # 1) Rehydrate primero (si falla, sigue levantando para no tumbar servicio)
    try:
        await rehydrate_from_command()
    except Exception as e:
        print(f"[booking-query] Rehydrate falló: {e}")

    # 2) Luego arranca el consumer para mantener el read-model al día
    consumer = EventConsumer()
    consumer.start()
    print("[booking-query] Consumidor RabbitMQ activo")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "booking-query"}
