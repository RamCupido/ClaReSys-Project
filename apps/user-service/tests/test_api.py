# src/tests/test_api.py
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.config.database import Base, get_db
from src.models.user import User
from src.api.router import pwd_context


# ----------------------------
# SQLite in-memory para tests
# ----------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ----------------------------
# Helpers
# ----------------------------
def create_user(email="user1@test.com", password="secret123", role="STUDENT"):
    payload = {"email": email, "password": password, "role": role}
    return client.post("/api/v1/users/", json=payload)


def get_db_session():
    return TestingSessionLocal()


# ----------------------------
# Tests
# ----------------------------
def test_create_user_success():
    r = create_user(email="a@test.com", password="secret123", role="ADMIN")
    assert r.status_code == 201, r.text

    data = r.json()
    assert "id" in data
    assert data["email"] == "a@test.com"
    assert data["role"] == "ADMIN"
    assert data["is_active"] is True


def test_create_user_duplicate_email_409():
    r1 = create_user(email="dup@test.com")
    assert r1.status_code == 201

    r2 = create_user(email="dup@test.com")
    assert r2.status_code == 409
    assert r2.json()["detail"] == "Email already registered"


def test_list_users_skip_limit():
    create_user(email="u1@test.com")
    create_user(email="u2@test.com")
    create_user(email="u3@test.com")

    r = client.get("/api/v1/users/?skip=1&limit=1")
    assert r.status_code == 200, r.text

    items = r.json()
    assert isinstance(items, list)
    assert len(items) == 1
    assert items[0]["email"] in {"u2@test.com", "u3@test.com"}


def test_get_user_by_id_success():
    created = create_user(email="get@test.com")
    user_id = created.json()["id"]

    r = client.get(f"/api/v1/users/{user_id}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["id"] == user_id
    assert data["email"] == "get@test.com"


def test_get_user_not_found_404():
    fake_id = str(uuid.uuid4())
    r = client.get(f"/api/v1/users/{fake_id}")
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


def test_update_user_role_and_active_success():
    created = create_user(email="upd@test.com", role="STUDENT")
    user_id = created.json()["id"]

    r = client.patch(
        f"/api/v1/users/{user_id}",
        json={"role": "TEACHER", "is_active": False},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["id"] == user_id
    assert data["role"] == "TEACHER"
    assert data["is_active"] is False


def test_update_user_password_changes_hash():
    # Create user
    email = "pwd@test.com"
    old_password = "secret123"
    new_password = "newsecret123"

    created = create_user(email=email, password=old_password)
    assert created.status_code == 201
    user_id = created.json()["id"]

    # Read hash from DB
    db = get_db_session()
    try:
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        assert user is not None
        old_hash = user.password_hash
        assert pwd_context.verify(old_password, old_hash) is True
    finally:
        db.close()

    # Actualice password via API
    r = client.patch(f"/api/v1/users/{user_id}", json={"password": new_password})
    assert r.status_code == 200, r.text

    # Verify that hash has changed in DB
    db = get_db_session()
    try:
        user2 = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        assert user2 is not None
        assert user2.password_hash != old_hash
        assert pwd_context.verify(new_password, user2.password_hash) is True
        assert pwd_context.verify(old_password, user2.password_hash) is False
    finally:
        db.close()


def test_update_user_not_found_404():
    fake_id = str(uuid.uuid4())
    r = client.patch(f"/api/v1/users/{fake_id}", json={"role": "ADMIN"})
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


def test_delete_user_success_and_then_404():
    created = create_user(email="del@test.com")
    user_id = created.json()["id"]

    r_del = client.delete(f"/api/v1/users/{user_id}")
    assert r_del.status_code == 204

    r_get = client.get(f"/api/v1/users/{user_id}")
    assert r_get.status_code == 404


def test_delete_user_not_found_404():
    fake_id = str(uuid.uuid4())
    r = client.delete(f"/api/v1/users/{fake_id}")
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"
