from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, model_validator
from uuid import UUID
from datetime import datetime

from src.infrastructure.database import get_db
from src.infrastructure.gateways.classroom_gateway import HttpClassroomGateway
from src.infrastructure.gateways.timetable_gateway import GrpcTimetableGateway
from src.infrastructure.gateways.rabbitmq_gateway import RabbitMQGateway
from src.domain.service import BookingService, ClassroomNotFoundError, ClassroomUnavailableError, ScheduleConflictError
from src.infrastructure.gateways.timetable_gateway import TimetableUnavailableError
from common.security import get_current_user, TokenData

router = APIRouter()

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

@router.post(
    "/",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED
)
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
        # Validación de negocio/inputs (si llega algo raro)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    
    except TimetableUnavailableError as e:
        raise HTTPException(status_code=503, detail="Timetable service no está disponible"+ str(e))

    except Exception as e:
        print(f"[booking-command] Internal error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
