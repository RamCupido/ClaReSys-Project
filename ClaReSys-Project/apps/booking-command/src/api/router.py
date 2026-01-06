from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from src.infrastructure.gateways.rabbitmq_gateway import RabbitMQGateway
from src.infrastructure.database import get_db
from src.infrastructure.gateways.classroom_gateway import HttpClassroomGateway
from src.infrastructure.gateways.timetable_gateway import GrpcTimetableGateway
from src.domain.service import BookingService
from common.security import get_current_user, TokenData

router = APIRouter()

# --- Esquemas Pydantic (DTOs) ---
class BookingCreateRequest(BaseModel):
    classroom_id: UUID
    start_time: datetime
    end_time: datetime

class BookingResponse(BaseModel):
    id: UUID
    status: str
    message: str

# --- Dependency Injection ---
def get_booking_service(db: Session = Depends(get_db)):
    classroom_gw = HttpClassroomGateway()
    timetable_gw = GrpcTimetableGateway()
    event_bus = RabbitMQGateway()
    return BookingService(db, classroom_gw, timetable_gw, event_bus)

# --- Endpoints ---
@router.post("/", response_model=BookingResponse)
def create_booking(
    request: BookingCreateRequest, 
    service: BookingService = Depends(get_booking_service),
    current_user: TokenData = Depends(get_current_user)
):
    try:
        booking = service.create_booking(
            user_id=UUID(current_user.user_id),
            classroom_id=request.classroom_id,
            start_time=request.start_time,
            end_time=request.end_time
        )
        return BookingResponse(
            id=booking.id, 
            status=booking.status,
            message="Reserva creada exitosamente"
        )
    except ValueError as e:
        # Business errors (Classroom does not exist, Schedule is booked)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Unexpected errors
        print(f"Error interno: {e}")
        raise HTTPException(status_code=500, detail="Error procesando la reserva")