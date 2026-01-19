from fastapi.testclient import TestClient
from src.main import app
from src.routes import router as router_module

def test_health():
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_report_classroom_returns_pdf(monkeypatch):

    async def fake_fetch_classroom(classroom_id, auth):
        return {"id": classroom_id, "code": "A-101", "capacity": 30, "is_operational": True}

    async def fake_fetch_bookings_for_classroom(classroom_id, auth):
        return {"total": 1, "items": [{
            "booking_id": "b1",
            "classroom_id": classroom_id,
            "user_id": "u1",
            "start_time": "2026-01-15T08:00:00Z",
            "end_time": "2026-01-15T10:00:00Z",
            "status": "CONFIRMED",
        }]}

    async def fake_fetch_maintenance_tickets(classroom_id, auth):
        return {"total": 1, "items": [{
            "ticket_id": "t1",
            "classroom_id": classroom_id,
            "priority": "CRITICAL",
            "status": "OPEN",
            "type": "PROJECTOR",
        }]}

    monkeypatch.setattr(router_module, "fetch_classroom", fake_fetch_classroom)
    monkeypatch.setattr(router_module, "fetch_bookings_for_classroom", fake_fetch_bookings_for_classroom)
    monkeypatch.setattr(router_module, "fetch_maintenance_tickets", fake_fetch_maintenance_tickets)

    client = TestClient(app)
    r = client.get("/api/v1/reports/classroom/c1?from=2026-01-01&to=2026-01-31")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/pdf")
    assert len(r.content) > 100  # PDF no vacío

def test_report_user_returns_pdf(monkeypatch):

    async def fake_fetch_bookings_for_user(user_id, auth):
        return {"total": 1, "items": [{
            "booking_id": "b1",
            "classroom_id": "c1",
            "user_id": user_id,
            "start_time": "2026-01-15T08:00:00Z",
            "end_time": "2026-01-15T10:00:00Z",
            "status": "CONFIRMED",
        }]}

    monkeypatch.setattr(router_module, "fetch_bookings_for_user", fake_fetch_bookings_for_user)

    client = TestClient(app)
    r = client.get("/api/v1/reports/user/u1")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/pdf")
    assert len(r.content) > 100
