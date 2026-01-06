from fastapi import APIRouter, HTTPException
from src.infrastructure.redis_client import get_redis_client
import json

router = APIRouter()
redis_client = get_redis_client()

@router.get("/{booking_id}")
def get_booking(booking_id: str):
    # Direct memory read from Redis
    data = redis_client.get(f"booking:{booking_id}")
    
    if not data:
        raise HTTPException(status_code=404, detail="Reserva no encontrada (o aún no sincronizada)")
        
    return json.loads(data)