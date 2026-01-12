from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from src.domain.models import Booking
from src.domain.ports import ClassroomGateway, TimetableGateway, EventBusGateway

class ClassroomNotFoundError(Exception):
    pass

class ClassroomUnavailableError(Exception):
    pass

class ScheduleConflictError(Exception):
    pass

class BookingNotFoundError(Exception):
    pass

class BookingForbiddenError(Exception):
    pass

class BookingService:
    def __init__(self, db: Session, classroom_gateway: ClassroomGateway, timetable_gateway: TimetableGateway, event_bus: EventBusGateway):
        self.db = db
        self.classroom_gw = classroom_gateway
        self.timetable_gw = timetable_gateway
        self.event_bus = event_bus

    def create_booking(self, user_id: UUID, classroom_id: UUID, start_time: datetime, end_time: datetime):

        classroom = self.classroom_gw.get_classroom(classroom_id)

        if classroom is None:
            raise ClassroomNotFoundError("Aula no encontrada")

        if classroom.get("is_operational") is False:
            raise ClassroomUnavailableError("Aula no disponible para reservas")
        
        existing = (self.db.query(Booking).filter(Booking.classroom_id == classroom_id,Booking.status == "CONFIRMED").all())

        existing_intervals = [(b.start_time.isoformat(), b.end_time.isoformat()) for b in existing]

        is_available = self.timetable_gw.check_availability(start_time, end_time, existing_intervals)

        if not is_available:
            raise ScheduleConflictError("Conflicto de horario con reservas existentes")

        new_booking = Booking(
            user_id=user_id,
            classroom_id=classroom_id,
            start_time=start_time,
            end_time=end_time,
            status="CONFIRMED"
        )

        self.db.add(new_booking)
        self.db.commit()
        self.db.refresh(new_booking)

        self.event_bus.publish("booking.created", {
            "booking_id": str(new_booking.id),
            "user_id": str(new_booking.user_id),
            "classroom_id": str(new_booking.classroom_id),
            "status": new_booking.status,
            "start_time": new_booking.start_time.isoformat(),
            "end_time": new_booking.end_time.isoformat(),
        })

        return new_booking
    
    def cancel_booking(self, booking_id: UUID, requester_user_id: UUID, *, allow_admin: bool = False):
        """Cancela una reserva (soft-delete) cambiando su estado.

        Nota: por simplicidad, allow_admin queda como flag para futuros roles.
        """

        booking: Booking | None = self.db.query(Booking).filter(Booking.id == booking_id).first()
        if booking is None:
            raise BookingNotFoundError("Reserva no encontrada")

        if not allow_admin and booking.user_id != requester_user_id:
            raise BookingForbiddenError("No tienes permisos para cancelar esta reserva")

        if booking.status == "CANCELLED":
            return booking

        booking.status = "CANCELLED"
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)

        self.event_bus.publish(
            "booking.canceled",
            {
                "booking_id": str(booking.id),
                "user_id": str(booking.user_id),
                "classroom_id": str(booking.classroom_id),
                "status": booking.status,
                "start_time": booking.start_time.isoformat(),
                "end_time": booking.end_time.isoformat(),
            },
        )

        return booking

