# tests/test_booking_service.py
import uuid
import pytest
from datetime import datetime, timezone, timedelta

# Asegúrate de que estos imports coincidan con tu estructura real
from src.domain.service import (
    BookingService,
    ClassroomNotFoundError,
    ClassroomUnavailableError,
    ScheduleConflictError,
    BookingNotFoundError,
    BookingForbiddenError,
)
from src.infrastructure.gateways.timetable_gateway import TimetableUnavailableError

# Si no puedes importar el modelo real en los tests unitarios sin DB, 
# puedes usar esta clase FakeBooking localmente para los tests.
class FakeBookingModel:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

# Intentamos usar el modelo real, si falla usamos el Fake
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
        self.last_args = None

    def check_availability(self, start_time, end_time, existing_intervals):
        if self.raise_error:
            # Simulamos caída del servicio gRPC
            raise TimetableUnavailableError("Connection refused")
        
        self.last_args = (start_time, end_time, existing_intervals)
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
        self._filters = []

    def filter(self, *args, **kwargs):
        self._filters.append((args, kwargs))
        return self

    def all(self):
        # Retorna todas las reservas CONFIRMED del fake session
        results = []
        for b in self.session._bookings.values():
            if getattr(b, "status", None) == "CONFIRMED":
                results.append(b)
        return results

    def first(self):
        # Simula búsqueda por ID
        bid = getattr(self.session, "_current_id_lookup", None)
        if not bid:
            return None
        return self.session._bookings.get(bid)


class FakeSession:
    def __init__(self):
        self._bookings = {}  # booking_id -> Booking object
        self._current_id_lookup = None # Hack para simular .filter(id=...).first()

    def query(self, model):
        return FakeQuery(self, model)

    def add(self, obj):
        # Simula autoincrement o UUID default de la DB
        if not hasattr(obj, "id") or obj.id is None:
            obj.id = uuid.uuid4()
        
        # Almacenamos en el diccionario simulando la tabla
        self._bookings[obj.id] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        pass


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

def test_create_booking_success_publishes_event():
    classroom_id = uuid.uuid4()
    user_id = uuid.uuid4()
    subject = "Sistemas Distribuidos"

    service, db = make_service(
        classroom_payload={"id": str(classroom_id), "is_operational": True},
        timetable_available=True,
    )

    booking = service.create_booking(
        user_id=user_id,
        classroom_id=classroom_id,
        start_time=dt(1),
        end_time=dt(2),
        subject=subject,
    )

    assert booking.status == "CONFIRMED"
    assert booking.id is not None
    assert booking.id in db._bookings
    assert booking.subject == subject

    # Verifica publicación de evento
    assert len(service.event_bus.published) == 1
    topic, payload = service.event_bus.published[0]
    assert topic == "booking.created"
    assert payload["booking_id"] == str(booking.id)
    assert payload["subject"] == subject


def test_create_booking_classroom_not_found():
    service, _ = make_service(classroom_payload=None)

    with pytest.raises(ClassroomNotFoundError):
        service.create_booking(
            user_id=uuid.uuid4(),
            classroom_id=uuid.uuid4(),
            start_time=dt(1),
            end_time=dt(2),
            subject="Test",
        )


def test_create_booking_classroom_unavailable():
    service, _ = make_service(classroom_payload={"is_operational": False})

    with pytest.raises(ClassroomUnavailableError):
        service.create_booking(
            user_id=uuid.uuid4(),
            classroom_id=uuid.uuid4(),
            start_time=dt(1),
            end_time=dt(2),
            subject="Test",
        )


def test_create_booking_schedule_conflict():
    # El timetable gateway retorna False (ocupado)
    service, _ = make_service(
        classroom_payload={"is_operational": True}, 
        timetable_available=False
    )

    with pytest.raises(ScheduleConflictError):
        service.create_booking(
            user_id=uuid.uuid4(),
            classroom_id=uuid.uuid4(),
            start_time=dt(1),
            end_time=dt(2),
            subject="Test",
        )

def test_create_booking_timetable_service_unavailable():
    # El timetable gateway lanza excepción de conexión
    service, _ = make_service(
        classroom_payload={"is_operational": True}, 
        timetable_error=True
    )

    with pytest.raises(TimetableUnavailableError):
        service.create_booking(
            user_id=uuid.uuid4(),
            classroom_id=uuid.uuid4(),
            start_time=dt(1),
            end_time=dt(2),
            subject="Test",
        )


def test_cancel_booking_not_found():
    service, db = make_service(classroom_payload={"is_operational": True})

    # Configuramos el FakeDB para que busque un ID que no existe
    db._current_id_lookup = uuid.uuid4()

    with pytest.raises(BookingNotFoundError):
        service.cancel_booking(booking_id=db._current_id_lookup, requester_user_id=uuid.uuid4())


def test_cancel_booking_forbidden():
    service, db = make_service(classroom_payload={"is_operational": True})

    owner_id = uuid.uuid4()
    other_id = uuid.uuid4()
    classroom_id = uuid.uuid4()

    # CORRECCIÓN: Se agrega 'subject' al crear el objeto manualmente
    b = Booking(
        user_id=owner_id,
        classroom_id=classroom_id,
        start_time=dt(1),
        end_time=dt(2),
        status="CONFIRMED",
        subject="Reunión Privada" 
    )
    db.add(b)

    # Simulamos que la query busca este ID
    db._current_id_lookup = b.id

    with pytest.raises(BookingForbiddenError):
        service.cancel_booking(booking_id=b.id, requester_user_id=other_id)


def test_cancel_booking_success_publishes_event_and_is_idempotent():
    service, db = make_service(classroom_payload={"is_operational": True})

    owner_id = uuid.uuid4()
    classroom_id = uuid.uuid4()

    # CORRECCIÓN: Se agrega 'subject'
    b = Booking(
        user_id=owner_id,
        classroom_id=classroom_id,
        start_time=dt(1),
        end_time=dt(2),
        status="CONFIRMED",
        subject="Clase de Python"
    )
    db.add(b)

    db._current_id_lookup = b.id
    
    # Primera cancelación
    cancelled = service.cancel_booking(booking_id=b.id, requester_user_id=owner_id)

    assert cancelled.status == "CANCELLED"
    assert len(service.event_bus.published) == 1
    assert service.event_bus.published[0][0] == "booking.canceled"

    # Idempotencia: segunda cancelación no explota ni publica de nuevo
    db._current_id_lookup = b.id
    cancelled2 = service.cancel_booking(booking_id=b.id, requester_user_id=owner_id)

    assert cancelled2.status == "CANCELLED"
    assert len(service.event_bus.published) == 1  # No aumenta