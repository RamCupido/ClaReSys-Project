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
    subject: str | None = None
    status: str | None = None

    model_config = ConfigDict(extra="allow")

def redis_dep() -> Redis:
    return get_redis_client()

@router.get("/bookings/{booking_id}",
            response_model=BookingView,
            status_code=status.HTTP_200_OK,
            summary="Get booking by ID",
            description="Retrieve a booking's details from Redis cache by its ID.",
            responses={
                200: {"description": "Booking found and returned."},
                404: {"description": "Booking not found"},
                500: {"description": "Internal server error"},})
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

class BookingListResponse(BaseModel):
    total: int
    items: list[BookingView]


@router.get("/bookings",
            response_model=BookingListResponse,
            status_code=status.HTTP_200_OK,
            summary="List bookings",
            description="List bookings from Redis cache with optional filtering.",
            responses={
                200: {"description": "List of bookings returned."},
            })
def list_bookings(
    user_id: UUID | None = None,
    classroom_id: UUID | None = None,
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
    redis_client: Redis = Depends(redis_dep),
):

    # Guardrails
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    if user_id and classroom_id:
        base_key = f"user:{user_id}:bookings"
    elif user_id:
        base_key = f"user:{user_id}:bookings"
    elif classroom_id:
        base_key = f"classroom:{classroom_id}:bookings"
    else:
        base_key = "bookings:all"

    booking_ids = list(redis_client.smembers(base_key))
    # Redis returns bytes, convert to str
    booking_ids = [bid.decode() if isinstance(bid, (bytes, bytearray)) else str(bid) for bid in booking_ids]

    # Fetch booking details
    docs: list[dict] = []
    for bid in booking_ids:
        raw = redis_client.get(f"booking:{bid}")
        if not raw:
            continue
        try:
            data = json.loads(raw)
            data["booking_id"] = bid
            docs.append(data)
        except Exception:
            # Skip corrupt entries
            continue

    # Additional filtering if both user_id and classroom_id are provided
    if user_id and classroom_id:
        docs = [d for d in docs if str(d.get("classroom_id")) == str(classroom_id)]

    # Filter by status if provided
    if status_filter:
        docs = [d for d in docs if str(d.get("status", "")).upper() == status_filter.upper()]

    # Sort by start_time if exists (descending by default can be adjusted)
    def _sort_key(d: dict):
        return d.get("start_time") or ""

    docs.sort(key=_sort_key)

    total = len(docs)
    page = docs[offset : offset + limit]

    return {
        "total": total,
        "items": page,
    }
