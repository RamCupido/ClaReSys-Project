from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from uuid import UUID
import json
from redis import Redis

from src.infrastructure.redis_client import get_redis_client

router = APIRouter()

class BookingView(BaseModel):
    booking_id: UUID
    user_id: UUID | None = None
    classroom_id: UUID | None = None
    status: str | None = None

    model_config = ConfigDict(extra="allow")

def redis_dep() -> Redis:
    return get_redis_client()

@router.get("/{booking_id}",response_model=BookingView,status_code=status.HTTP_200_OK)
def get_booking(booking_id: UUID, redis_client: Redis = Depends(redis_dep)):
    data = redis_client.get(f"booking:{booking_id}")

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada (o aún no sincronizada)"
        )

    try:
        payload = json.loads(data)
        payload["booking_id"] = str(booking_id)
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Entrada de caché de reserva corrupta"
        )
