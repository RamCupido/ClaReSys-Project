# tests/test_booking_service.py
import uuid
from datetime import datetime, timezone, timedelta

import pytest

from src.domain.service import (
    BookingService,
    ClassroomNotFoundError,
    ClassroomUnavailableError,
    ScheduleConflictError,
    BookingNotFoundError,
    BookingForbiddenError,
)
from src.domain.models import Booking


# ----------------------------
# Fakes / Doubles
# ----------------------------

class FakeClassroomGateway:
    def __init__(self, classroom=None):
        self._classroom = classroom

    def get_classroom(self, classroom_id):
        return self._classroom


class FakeTimetableGateway:
    def __init__(self, available=True):
        self.available = available
        self.last_args = None

    def check_availability(self, start_time, end_time, existing_intervals):
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
        # No evaluamos expresiones SQLAlchemy.
        # El servicio usa filter(...) pero luego pide all()/first().
        # Por simplicidad, almacenamos una bandera y la resolvemos por intención.
        self._filters.append((args, kwargs))
        return self

    def all(self):
        # En create_booking: quieren reservas CONFIRMED para el classroom_id.
        # Resolvemos usando atributos directos.
        results = []
        for b in self.session._bookings.values():
            if getattr(b, "status", None) == "CONFIRMED":
                # el classroom_id viene en el Booking ya creado
                results.append(b)
        return results

    def first(self):
        # En cancel_booking: buscan por Booking.id
        # Extraemos el booking_id desde el último filter si podemos, si no: None.
        # Como no interpretamos expresiones, usamos un atajo: el test setea current_id_lookup.
        bid = getattr(self.session, "_current_id_lookup", None)
        if not bid:
            return None
        return self.session._bookings.get(bid)


class FakeSession:
    def __init__(self):
        self._bookings = {}  # booking_id -> Booking

        # hack para "first()" por id
        self._current_id_lookup = None

    def query(self, model):
        return FakeQuery(self, model)

    def add(self, obj):
        # emula asignación de PK si está vacía
        if isinstance(obj, Booking) and getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        if isinstance(obj, Booking):
            self._bookings[obj.id] = obj

    def commit(self):
        return

    def refresh(self, obj):
        return


# ----------------------------
# Helpers
# ----------------------------

def dt(hours_from_now: int):
    return datetime.now(timezone.utc) + timedelta(hours=hours_from_now)


# ----------------------------
# Tests
# ----------------------------

def make_service(
    *,
    classroom_payload,
    timetable_available=True,
):
    db = FakeSession()
    service = BookingService(
        db=db,
        classroom_gateway=FakeClassroomGateway(classroom=classroom_payload),
        timetable_gateway=FakeTimetableGateway(available=timetable_available),
        event_bus=FakeEventBus(),
    )
    return service, db


def test_create_booking_success_publishes_event():
    classroom_id = uuid.uuid4()
    user_id = uuid.uuid4()

    service, db = make_service(
        classroom_payload={"id": str(classroom_id), "is_operational": True},
        timetable_available=True,
    )

    booking = service.create_booking(
        user_id=user_id,
        classroom_id=classroom_id,
        start_time=dt(1),
        end_time=dt(2),
    )

    assert booking.status == "CONFIRMED"
    assert booking.id is not None
    assert booking.id in db._bookings

    # Verifica publicación
    assert len(service.event_bus.published) == 1
    topic, payload = service.event_bus.published[0]
    assert topic == "booking.created"
    assert payload["booking_id"] == str(booking.id)
    assert payload["user_id"] == str(user_id)
    assert payload["classroom_id"] == str(classroom_id)
    assert payload["status"] == "CONFIRMED"
    assert "start_time" in payload
    assert "end_time" in payload


def test_create_booking_classroom_not_found():
    service, _ = make_service(classroom_payload=None, timetable_available=True)

    with pytest.raises(ClassroomNotFoundError):
        service.create_booking(
            user_id=uuid.uuid4(),
            classroom_id=uuid.uuid4(),
            start_time=dt(1),
            end_time=dt(2),
        )


def test_create_booking_classroom_unavailable():
    service, _ = make_service(classroom_payload={"is_operational": False}, timetable_available=True)

    with pytest.raises(ClassroomUnavailableError):
        service.create_booking(
            user_id=uuid.uuid4(),
            classroom_id=uuid.uuid4(),
            start_time=dt(1),
            end_time=dt(2),
        )


def test_create_booking_schedule_conflict():
    service, _ = make_service(classroom_payload={"is_operational": True}, timetable_available=False)

    with pytest.raises(ScheduleConflictError):
        service.create_booking(
            user_id=uuid.uuid4(),
            classroom_id=uuid.uuid4(),
            start_time=dt(1),
            end_time=dt(2),
        )


def test_cancel_booking_not_found():
    service, db = make_service(classroom_payload={"is_operational": True}, timetable_available=True)

    # sin booking en DB; indicamos lookup
    db._current_id_lookup = uuid.uuid4()

    with pytest.raises(BookingNotFoundError):
        service.cancel_booking(booking_id=db._current_id_lookup, requester_user_id=uuid.uuid4())


def test_cancel_booking_forbidden():
    service, db = make_service(classroom_payload={"is_operational": True}, timetable_available=True)

    owner_id = uuid.uuid4()
    other_id = uuid.uuid4()
    classroom_id = uuid.uuid4()

    # crea booking manualmente en el fake db
    b = Booking(
        user_id=owner_id,
        classroom_id=classroom_id,
        start_time=dt(1),
        end_time=dt(2),
        status="CONFIRMED",
    )
    db.add(b)

    db._current_id_lookup = b.id

    with pytest.raises(BookingForbiddenError):
        service.cancel_booking(booking_id=b.id, requester_user_id=other_id)


def test_cancel_booking_success_publishes_event_and_is_idempotent():
    service, db = make_service(classroom_payload={"is_operational": True}, timetable_available=True)

    owner_id = uuid.uuid4()
    classroom_id = uuid.uuid4()

    b = Booking(
        user_id=owner_id,
        classroom_id=classroom_id,
        start_time=dt(1),
        end_time=dt(2),
        status="CONFIRMED",
    )
    db.add(b)

    db._current_id_lookup = b.id
    cancelled = service.cancel_booking(booking_id=b.id, requester_user_id=owner_id)

    assert cancelled.status == "CANCELLED"
    assert len(service.event_bus.published) == 1
    topic, payload = service.event_bus.published[0]
    assert topic == "booking.canceled"
    assert payload["booking_id"] == str(b.id)
    assert payload["status"] == "CANCELLED"

    # idempotencia: segunda cancelación no vuelve a publicar evento
    db._current_id_lookup = b.id
    cancelled2 = service.cancel_booking(booking_id=b.id, requester_user_id=owner_id)

    assert cancelled2.status == "CANCELLED"
    assert len(service.event_bus.published) == 1  # se mantiene
