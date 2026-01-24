from fastapi.testclient import TestClient
from src.main import app

from src.config import db as db_module
from src.routes import router as router_module

class FakePublisher:
    def __init__(self):
        self.events = []

    def publish(self, routing_key, payload):
        self.events.append((routing_key, payload))

    def close(self):
        return

class FakeCollection:
    def __init__(self):
        self.docs = []

    def create_index(self, *_args, **_kwargs):
        return None

    def insert_one(self, doc):
        # simulate _id
        d = dict(doc)
        d["_id"] = f"id-{len(self.docs)+1}"
        self.docs.append(d)

        class R:
            inserted_id = d["_id"]
        return R()

    def find_one(self, q):
        for d in self.docs:
            ok = True
            for k, v in q.items():
                if d.get(k) != v:
                    ok = False
                    break
            if ok:
                return dict(d)
        return None

    def count_documents(self, q):
        return len(self._filter(q))

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

    def update_one(self, q, upd):
        doc = self.find_one(q)
        if not doc:
            return
        # apply $set
        for i, d in enumerate(self.docs):
            if d.get("ticket_id") == doc.get("ticket_id"):
                d.update(upd.get("$set", {}))
                self.docs[i] = d
                return

    def _filter(self, q):
        def ok(doc):
            for k, v in q.items():
                if doc.get(k) != v:
                    return False
            return True
        return [d for d in self.docs if ok(d)]


def test_create_list_update(monkeypatch):
    fake_col = FakeCollection()
    fake_pub = FakePublisher()

    # override of dependencies (FastAPI)
    app.dependency_overrides[db_module.get_collection] = lambda: fake_col
    app.dependency_overrides[router_module.get_publisher] = lambda: fake_pub

    client = TestClient(app)

    # create
    r1 = client.post("/api/v1/maintenance/tickets", json={
        "classroom_id": "c1",
        "reported_by_user_id": "u1",
        "type": "PROYECTOR",
        "priority": "CRITICO",
        "description": "Projector broken"
    })
    assert r1.status_code == 201, r1.text
    created = r1.json()
    assert created["status"] == "ABIERTO"
    assert created["priority"] == "CRITICO"
    ticket_id = created["ticket_id"]

    # list
    r2 = client.get("/api/v1/maintenance/tickets?classroom_id=c1")
    assert r2.status_code == 200
    assert r2.json()["total"] == 1

    # update to RESOLVED
    r3 = client.patch(f"/api/v1/maintenance/tickets/{ticket_id}", json={"status": "RESUELTO"})
    assert r3.status_code == 200
    assert r3.json()["status"] == "RESUELTO"

    # published events (created, blocked, updated, resolved, unblocked)
    keys = [k for (k, _p) in fake_pub.events]
    assert "maintenance.ticket.created" in keys
    assert "classroom.blocked_by_maintenance" in keys
    assert "maintenance.ticket.updated" in keys
    assert "maintenance.ticket.resolved" in keys
    assert "classroom.unblocked_by_maintenance" in keys

    app.dependency_overrides = {}
