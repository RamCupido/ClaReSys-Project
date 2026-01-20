# tests/test_consumer_and_router.py
import json
import uuid
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from src.events.consumer import EventConsumer
from src.api.router import get_booking, list_bookings


class FakeRedis:
    def __init__(self):
        self.kv = {}
        self.sets = {}

    def set(self, key, value):
        self.kv[key] = value
        return True

    def get(self, key):
        return self.kv.get(key)

    def sadd(self, key, member):
        self.sets.setdefault(key, set()).add(str(member))
        return 1

    def smembers(self, key):
        # router espera bytes o str; devolvemos str
        return self.sets.get(key, set())


def sample_event(status="CONFIRMED"):
    booking_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    classroom_id = str(uuid.uuid4())
    return {
        "booking_id": booking_id,
        "user_id": user_id,
        "classroom_id": classroom_id,
        "subject": "Sistemas Distribuidos",
        "status": status,
        "start_time": datetime(2026, 1, 15, 8, 0, tzinfo=timezone.utc).isoformat(),
        "end_time": datetime(2026, 1, 15, 10, 0, tzinfo=timezone.utc).isoformat(),
    }


def test_consumer_process_event_stores_booking_and_indexes(monkeypatch):
    fake_redis = FakeRedis()

    # construimos consumer sin conectar a rabbitmq (no llamamos run)
    consumer = EventConsumer()
    consumer.redis = fake_redis  # inyectamos fake redis

    ev = sample_event()
    consumer.process_event(None, None, None, json.dumps(ev).encode())

    # documento principal
    assert fake_redis.get(f"booking:{ev['booking_id']}") is not None

    # índices
    assert ev["booking_id"] in fake_redis.smembers("bookings:all")
    assert ev["booking_id"] in fake_redis.smembers(f"user:{ev['user_id']}:bookings")
    assert ev["booking_id"] in fake_redis.smembers(f"classroom:{ev['classroom_id']}:bookings")


def test_get_booking_404_when_missing():
    fake_redis = FakeRedis()
    bid = uuid.uuid4()

    with pytest.raises(HTTPException) as ex:
        get_booking(booking_id=bid, redis_client=fake_redis)

    assert ex.value.status_code == 404


def test_get_booking_success():
    fake_redis = FakeRedis()
    ev = sample_event()
    bid = uuid.UUID(ev["booking_id"])

    fake_redis.set(f"booking:{ev['booking_id']}", json.dumps(ev))

    result = get_booking(booking_id=bid, redis_client=fake_redis)
    assert str(result["booking_id"]) == ev["booking_id"]
    assert result["status"] == ev["status"]


def test_list_bookings_filters_and_pagination():
    fake_redis = FakeRedis()

    ev1 = sample_event(status="CONFIRMED")
    ev2 = sample_event(status="CANCELLED")

    # Guardar docs
    fake_redis.set(f"booking:{ev1['booking_id']}", json.dumps(ev1))
    fake_redis.set(f"booking:{ev2['booking_id']}", json.dumps(ev2))

    # índices "all"
    fake_redis.sadd("bookings:all", ev1["booking_id"])
    fake_redis.sadd("bookings:all", ev2["booking_id"])

    # filtro por status
    resp = list_bookings(status_filter="CONFIRMED", limit=50, offset=0, redis_client=fake_redis)
    assert resp["total"] == 1
    assert resp["items"][0]["status"] == "CONFIRMED"

    # paginación
    resp2 = list_bookings(limit=1, offset=0, redis_client=fake_redis)
    assert resp2["total"] == 2
    assert len(resp2["items"]) == 1
