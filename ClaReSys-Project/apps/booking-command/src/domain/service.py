from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from src.domain.models import Booking
from src.domain.ports import ClassroomGateway, TimetableGateway, EventBusGateway

class BookingService:
    def __init__(self, db: Session, classroom_gateway: ClassroomGateway, timetable_gateway: TimetableGateway, event_bus: EventBusGateway):
        self.db = db
        self.classroom_gw = classroom_gateway
        self.timetable_gw = timetable_gateway
        self.event_bus = event_bus

    def create_booking(self, user_id: UUID, classroom_id: UUID, start_time: datetime, end_time: datetime):
        # 1. Validate classroom existence (Llamada HTTP)
        if not self.classroom_gw.exists(classroom_id):
            raise ValueError("El aula especificada no existe.")

        # 2. Get existing bookings for the classroom
        existing_db_bookings = self.db.query(Booking).filter(
            Booking.classroom_id == classroom_id,
            Booking.status == "CONFIRMED"
        ).all()
        
        existing_intervals = [(b.start_time, b.end_time) for b in existing_db_bookings]

        # 3. Validate timetable availability (Llamada gRPC)
        is_available = self.timetable_gw.check_availability(start_time, end_time, existing_intervals)
        
        if not is_available:
            raise ValueError("Conflicto de horario: El aula ya está reservada en ese lapso.")

        # 4. Save the booking
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
        
        # 5. Publish event to event bus
        event_payload = {
            "booking_id": str(new_booking.id),
            "user_id": str(new_booking.user_id),
            "email": "student@uce.edu.ec",
            "status": "CONFIRMED"
        }
        self.event_bus.publish("booking.created", event_payload)

        return new_booking