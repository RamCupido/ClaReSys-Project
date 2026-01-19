# tests/test_booking_service.py
import uuid
import pytest
from datetime import datetime, timezone, timedelta

# Asegúrate de que los imports coincidan con tu proyecto
from src.domain.service import (
    BookingService,
    ClassroomNotFoundError,
    ClassroomUnavailableError,
    ScheduleConflictError,
    BookingNotFoundError,
    BookingForbiddenError,
)
from src.infrastructure.gateways.timetable_gateway import TimetableUnavailableError

# Dummy class si no se puede importar el modelo real
class FakeBookingModel:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

try:
    from src.domain.models import Booking
except ImportError:
    Booking = FakeBookingModel

# ----------------------------
# Fakes / Doubles
# ----------------------------

class FakeClassroomGateway:
    def __init__(self, classroom=None):
        self._classroom = classroom

    def get_classroom(self, classroom_id):
        return self._classroom


class FakeTimetableGateway:
    def __init__(self, available=True, raise_error=False):
        self.available = available
        self.raise_error = raise_error

    def check_availability(self, start_time, end_time, existing_intervals):
        if self.raise_error:
            raise TimetableUnavailableError("Connection refused")
        return self.available


class FakeEventBus:
    def __init__(self):
        self.published = []

    def publish(self, topic, payload):
        self.published.append((topic, payload))


class FakeQuery:
    def __init__(self, session, model):
        self.session = session
        self.model = model

    def filter(self, *args, **kwargs):
        # Simplemente retornamos self para encadenar
        return self

    def all(self):
        # Retorna bookings con status CONFIRMED
        return [b for b in self.session._bookings.values() 
                if getattr(b, "status", None) == "CONFIRMED"]

    def first(self):
        # Simula búsqueda por ID usando el hack _current_id_lookup
        bid = getattr(self.session, "_current_id_lookup", None)
        if not bid:
            return None
        return self.session._bookings.get(bid)


class FakeSession:
    def __init__(self):
        self._bookings = {}  # Dict[uuid, Booking]
        self._current_id_lookup = None 

    def query(self, model):
        return FakeQuery(self, model)

    def add(self, obj):
        if not hasattr(obj, "id") or obj.id is None:
            obj.id = uuid.uuid4()
        self._bookings[obj.id] = obj

    def commit(self): pass
    def refresh(self, obj): pass


# ----------------------------
# Helpers
# ----------------------------

def dt(hours_from_now: int):
    return datetime.now(timezone.utc) + timedelta(hours=hours_from_now)

def make_service(*, classroom_payload, timetable_available=True, timetable_error=False):
    db = FakeSession()
    service = BookingService(
        db=db,
        classroom_gateway=FakeClassroomGateway(classroom=classroom_payload),
        timetable_gateway=FakeTimetableGateway(available=timetable_available, raise_error=timetable_error),
        event_bus=FakeEventBus(),
    )
    return service, db


# ----------------------------
# Tests
# ----------------------------

def test_create_booking_success():
    service, db = make_service(
        classroom_payload={"id": str(uuid.uuid4()), "is_operational": True}
    )
    
    booking = service.create_booking(
        user_id=uuid.uuid4(),
        classroom_id=uuid.uuid4(),
        start_time=dt(1),
        end_time=dt(2),
        subject="Math 101"
    )

    assert booking.status == "CONFIRMED"
    assert len(service.event_bus.published) == 1
    assert service.event_bus.published[0][0] == "booking.created"


def test_cancel_booking_not_found():
    service, db = make_service(classroom_payload={"is_operational": True})
    
    # ID random que no existe en DB
    db._current_id_lookup = uuid.uuid4()

    with pytest.raises(BookingNotFoundError):
        service.cancel_booking(
            booking_id=db._current_id_lookup, 
            requester_user_id=uuid.uuid4(),
            requester_role="student"
        )


def test_cancel_booking_forbidden():
    """
    Este test asegura que un estudiante NO pueda cancelar la reserva de otro.
    Si falla con 'DID NOT RAISE', revisa tu BookingService.py.
    """
    service, db = make_service(classroom_payload={"is_operational": True})

    owner_id = uuid.uuid4()
    other_id = uuid.uuid4() # <--- ID diferente
    classroom_id = uuid.uuid4()

    # 1. Crear reserva a nombre del Owner
    b = Booking(
        user_id=owner_id,
        classroom_id=classroom_id,
        start_time=dt(1),
        end_time=dt(2),
        status="CONFIRMED",
        subject="Reunión Privada"
    )
    db.add(b)

    # 2. Configurar el Fake para que encuentre esta reserva
    db._current_id_lookup = b.id

    # 3. Intentar cancelar con 'other_id' (Intruso)
    with pytest.raises(BookingForbiddenError):
        service.cancel_booking(
            booking_id=b.id, 
            requester_user_id=other_id, # Intruso
            requester_role="student"    # Rol sin privilegios de admin
        )


def test_cancel_booking_success():
    service, db = make_service(classroom_payload={"is_operational": True})

    owner_id = uuid.uuid4()
    b = Booking(
        user_id=owner_id,
        classroom_id=uuid.uuid4(),
        start_time=dt(1),
        end_time=dt(2),
        status="CONFIRMED",
        subject="Clase Python"
    )
    db.add(b)

    db._current_id_lookup = b.id
    
    # El mismo dueño cancela -> Debe funcionar
    cancelled = service.cancel_booking(
        booking_id=b.id, 
        requester_user_id=owner_id, 
        requester_role="student"
    )

    assert cancelled.status == "CANCELLED"
    assert len(service.event_bus.published) == 1
    assert service.event_bus.published[0][0] == "booking.canceled"