from typing import Optional
import os
from fastapi import Header
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, model_validator
from uuid import UUID
from datetime import datetime

from src.infrastructure.database import get_db
from src.infrastructure.gateways.classroom_gateway import HttpClassroomGateway
from src.infrastructure.gateways.timetable_gateway import GrpcTimetableGateway
from src.infrastructure.gateways.rabbitmq_gateway import RabbitMQGateway
from src.domain.service import BookingService, ClassroomNotFoundError, ClassroomUnavailableError, ScheduleConflictError, BookingNotFoundError, BookingForbiddenError
from src.infrastructure.gateways.timetable_gateway import TimetableUnavailableError
from common.security import get_current_user, TokenData

router = APIRouter()

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

class BookingCreateRequest(BaseModel):
    classroom_id: UUID
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be greater than start_time")
        return self

class BookingResponse(BaseModel):
    id: UUID
    status: str
    message: str

@router.post("/",response_model=BookingResponse,status_code=status.HTTP_201_CREATED)
def create_booking(
    request: BookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    service = BookingService(
        db=db,
        classroom_gateway=HttpClassroomGateway(),
        timetable_gateway=GrpcTimetableGateway(),
        event_bus=RabbitMQGateway(),
    )

    try:
        booking = service.create_booking(
            user_id=UUID(current_user.user_id),
            classroom_id=request.classroom_id,
            start_time=request.start_time,
            end_time=request.end_time,
        )
        return BookingResponse(
            id=booking.id,
            status=booking.status,
            message="Booking created successfully"
        )

    except ClassroomNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    except ClassroomUnavailableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    except ScheduleConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    
    except TimetableUnavailableError as e:
        raise HTTPException(status_code=503, detail="Timetable service no está disponible"+ str(e))

    except Exception as e:
        print(f"[booking-command] Internal error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{booking_id}", response_model=BookingResponse, status_code=status.HTTP_200_OK)
def cancel_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Cancela (soft-delete) una reserva.

    - Mantiene el registro en la BD.
    - Publica evento booking.canceled para que el query service actualice Redis.
    """

    service = BookingService(
        db=db,
        classroom_gateway=HttpClassroomGateway(),
        timetable_gateway=GrpcTimetableGateway(),
        event_bus=RabbitMQGateway(),
    )

    try:
        booking = service.cancel_booking(
            booking_id=booking_id,
            requester_user_id=UUID(current_user.user_id),
        )

        return BookingResponse(
            id=booking.id,
            status=booking.status,
            message="Booking canceled successfully",
        )

    except BookingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    except BookingForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    except Exception as e:
        print(f"[booking-command] Internal error (cancel): {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def _require_internal_key(x_internal_api_key: Optional[str]):
    if not INTERNAL_API_KEY:
        return
    if x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal key")


@router.get("/internal/bookings")
def internal_list_bookings(
    limit: int = 1000,
    offset: int = 0,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None),
):
    """
    Exporta bookings desde el write-store (Postgres) para rehidratar el read-model.
    """
    _require_internal_key(x_internal_api_key)

    # Ajusta la referencia al modelo Booking según tu proyecto
    from src.domain.models import Booking

    rows = (
        db.query(Booking)
        .order_by(Booking.created_at.desc() if hasattr(Booking, "created_at") else Booking.start_time.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for b in rows:
        items.append(
            {
                "booking_id": str(b.id),
                "user_id": str(b.user_id),
                "classroom_id": str(b.classroom_id),
                "status": b.status,
                "start_time": b.start_time.isoformat() if b.start_time else None,
                "end_time": b.end_time.isoformat() if b.end_time else None,
                # opcional
                "created_at": b.created_at.isoformat() if getattr(b, "created_at", None) else None,
            }
        )

    return {"total": len(items), "items": items}