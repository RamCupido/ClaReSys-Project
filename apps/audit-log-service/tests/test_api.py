from datetime import datetime, timezone
from fastapi.testclient import TestClient

from src.main import app
from src.config import db as db_module


class FakeCollection:
    def __init__(self):
        self.docs = []
        self._id = 0

    def create_index(self, *_args, **_kwargs):
        return None

    def insert_one(self, doc):
        self._id += 1
        doc = dict(doc)
        doc["_id"] = str(self._id)
        self.docs.append(doc)

        class R:
            inserted_id = doc["_id"]
        return R()

    def count_documents(self, q):
        return len(self._filter(q))

    def find_one(self, q):
        for d in self.docs:
            if d["_id"] == q.get("_id"):
                return dict(d)
        return None

    def find(self, q):
        data = self._filter(q)

        class Cursor:
            def __init__(self, items):
                self.items = items

            def sort(self, *_args, **_kwargs):
                return self

            def skip(self, n):
                self.items = self.items[n:]
                return self

            def limit(self, n):
                self.items = self.items[:n]
                return self

            def __iter__(self):
                for i in self.items:
                    yield dict(i)

        return Cursor(data)

    def _filter(self, q):
        def ok(doc):
            for k, v in q.items():
                if k == "timestamp":
                    ts = doc.get("timestamp")
                    if isinstance(v, dict):
                        if "$gte" in v and ts < v["$gte"]:
                            return False
                        if "$lte" in v and ts > v["$lte"]:
                            return False
                else:
                    if doc.get(k) != v:
                        return False
            return True

        return [d for d in self.docs if ok(d)]


def test_health():
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_and_list():
    fake = FakeCollection()

    # ✅ Override de la dependencia que usan tus rutas
    app.dependency_overrides[db_module.get_collection] = lambda: fake

    client = TestClient(app)

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "booking-command",
        "action": "booking.created",
        "status": "SUCCESS",
        "actor_user_id": "u1",
        "role": "ADMIN",
        "resource_type": "booking",
        "resource_id": "b1",
        "correlation_id": "req-1",
        "payload": {"x": 1},
    }

    r1 = client.post("/api/v1/audit-logs/", json=payload)
    assert r1.status_code == 201, r1.text
    assert "id" in r1.json()

    r2 = client.get("/api/v1/audit-logs/?service=booking-command&limit=50&offset=0")
    assert r2.status_code == 200
    data = r2.json()
    assert data["total"] == 1
    assert data["items"][0]["action"] == "booking.created"

    # Limpieza para que no afecte otros tests
    app.dependency_overrides = {}
