import os
import sys
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.config.database import Base, get_db


# ---------------------------------------
# DB in memory setup
# ---------------------------------------
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


# ---------------------------------------
# Helpers
# ---------------------------------------
def create_classroom(code="A1", capacity=10, is_operational=True, location_details=None):
    payload = {
        "code": code,
        "capacity": capacity,
        "is_operational": is_operational,
    }
    if location_details is not None:
        payload["location_details"] = location_details

    r = client.post("/api/v1/classrooms/", json=payload)
    return r


# ---------------------------------------
# TESTS
# ---------------------------------------

def test_create_classroom_success():
    response = create_classroom(code="TEST-101", capacity=20, is_operational=True)
    assert response.status_code == 201

    data = response.json()
    assert data["code"] == "TEST-101"
    assert data["capacity"] == 20
    assert data["is_operational"] is True
    assert "id" in data


def test_create_classroom_normalizes_code_strip_upper():
    response = create_classroom(code="  teSt-1  ", capacity=15)
    assert response.status_code == 201
    data = response.json()
    assert data["code"] == "TEST-1"


def test_create_duplicate_classroom_fails_409():
    r1 = create_classroom(code="A1", capacity=10)
    assert r1.status_code == 201

    r2 = create_classroom(code="A1", capacity=10)
    assert r2.status_code == 409
    assert r2.json()["detail"] == "Classroom code already registered"


def test_list_classrooms_returns_created_items():
    create_classroom(code="A1", capacity=10, is_operational=True)
    create_classroom(code="A2", capacity=20, is_operational=False)

    r = client.get("/api/v1/classrooms/")
    assert r.status_code == 200

    items = r.json()
    assert isinstance(items, list)
    assert len(items) == 2
    codes = {x["code"] for x in items}
    assert codes == {"A1", "A2"}


def test_list_classrooms_only_operational_filter():
    create_classroom(code="A1", capacity=10, is_operational=True)
    create_classroom(code="A2", capacity=20, is_operational=False)

    r = client.get("/api/v1/classrooms/?only_operational=true")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["code"] == "A1"
    assert items[0]["is_operational"] is True


def test_get_classroom_by_id_success():
    created = create_classroom(code="A1", capacity=10)
    classroom_id = created.json()["id"]

    r = client.get(f"/api/v1/classrooms/{classroom_id}")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == classroom_id
    assert data["code"] == "A1"


def test_get_classroom_not_found_404():
    fake_id = str(uuid.uuid4())
    r = client.get(f"/api/v1/classrooms/{fake_id}")
    assert r.status_code == 404
    assert r.json()["detail"] == "Classroom not found"


def test_update_classroom_patch_success():
    created = create_classroom(code="A1", capacity=10, is_operational=True)
    classroom_id = created.json()["id"]

    r = client.patch(
        f"/api/v1/classrooms/{classroom_id}",
        json={"capacity": 35, "is_operational": False},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == classroom_id
    assert data["capacity"] == 35
    assert data["is_operational"] is False


def test_update_classroom_normalizes_code():
    created = create_classroom(code="A1", capacity=10)
    classroom_id = created.json()["id"]

    r = client.patch(
        f"/api/v1/classrooms/{classroom_id}",
        json={"code": "  a-99  "},
    )
    assert r.status_code == 200
    assert r.json()["code"] == "A-99"


def test_update_classroom_duplicate_code_fails_409():
    c1 = create_classroom(code="A1", capacity=10)
    c2 = create_classroom(code="A2", capacity=20)
    assert c1.status_code == 201
    assert c2.status_code == 201

    classroom_id_2 = c2.json()["id"]

    r = client.patch(
        f"/api/v1/classrooms/{classroom_id_2}",
        json={"code": "A1"},
    )
    assert r.status_code == 409
    assert r.json()["detail"] == "Classroom code already registered"


def test_update_classroom_not_found_404():
    fake_id = str(uuid.uuid4())
    r = client.patch(f"/api/v1/classrooms/{fake_id}", json={"capacity": 99})
    assert r.status_code == 404
    assert r.json()["detail"] == "Classroom not found"


def test_delete_classroom_success_and_then_404_on_get():
    created = create_classroom(code="A1", capacity=10)
    classroom_id = created.json()["id"]

    r_del = client.delete(f"/api/v1/classrooms/{classroom_id}")
    assert r_del.status_code == 204

    r_get = client.get(f"/api/v1/classrooms/{classroom_id}")
    assert r_get.status_code == 404


def test_delete_classroom_not_found_404():
    fake_id = str(uuid.uuid4())
    r = client.delete(f"/api/v1/classrooms/{fake_id}")
    assert r.status_code == 404
    assert r.json()["detail"] == "Classroom not found"
