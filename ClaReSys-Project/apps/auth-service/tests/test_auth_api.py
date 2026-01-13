# apps/auth-service/tests/test_auth_api.py
import uuid
import pytest
from fastapi.testclient import TestClient
from jose import jwt

from src.main import app
from src.utils import security


client = TestClient(app)


class FakeUser:
    def __init__(self, *, user_id: uuid.UUID, role: str, password_hash: str):
        self.id = user_id
        self.role = role
        self.password_hash = password_hash


def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["service"] == "auth-service"


def test_login_success_returns_jwt_and_fields(monkeypatch):
    user_id = uuid.uuid4()
    role = "ADMIN"
    plain_password = "secret123"
    password_hash = security.get_password_hash(plain_password)

    # Monkeypatch del gateway usado en la ruta
    from src.routes import auth as auth_route

    class FakeGateway:
        def get_user_by_email(self, email: str):
            return FakeUser(user_id=user_id, role=role, password_hash=password_hash)

    monkeypatch.setattr(auth_route, "UserGateway", lambda: FakeGateway())

    r = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": plain_password},
    )

    assert r.status_code == 200, r.text
    data = r.json()

    assert data["token_type"] == "bearer"
    assert data["user_id"] == str(user_id)
    assert data["role"] == role
    assert "access_token" in data

    # Verifica JWT (sub y role)
    decoded = jwt.decode(
        data["access_token"],
        security.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    assert decoded["sub"] == str(user_id)
    assert decoded["role"] == role
    assert "exp" in decoded


def test_login_user_not_found_returns_401(monkeypatch):
    from src.routes import auth as auth_route

    class FakeGateway:
        def get_user_by_email(self, email: str):
            return None

    monkeypatch.setattr(auth_route, "UserGateway", lambda: FakeGateway())

    r = client.post(
        "/api/v1/auth/login",
        json={"email": "nope@test.com", "password": "secret123"},
    )
    assert r.status_code == 401
    assert "Usuario no encontrado" in r.json()["detail"]


def test_login_wrong_password_returns_401(monkeypatch):
    from src.routes import auth as auth_route

    user_id = uuid.uuid4()
    role = "STUDENT"
    password_hash = security.get_password_hash("correct-password")

    class FakeGateway:
        def get_user_by_email(self, email: str):
            return FakeUser(user_id=user_id, role=role, password_hash=password_hash)

    monkeypatch.setattr(auth_route, "UserGateway", lambda: FakeGateway())

    r = client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "wrong-password"},
    )
    assert r.status_code == 401
    assert "Password erróneo" in r.json()["detail"]


def test_login_user_service_unavailable_returns_503(monkeypatch):
    from src.routes import auth as auth_route

    class FakeGateway:
        def get_user_by_email(self, email: str):
            raise RuntimeError("Servicio de usuario no disponible: down")

    monkeypatch.setattr(auth_route, "UserGateway", lambda: FakeGateway())

    r = client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "secret123"},
    )
    assert r.status_code == 503
    assert r.json()["detail"] == "Servicio de usuario no disponible"
