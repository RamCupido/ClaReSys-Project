import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '../../'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.config.database import Base, get_db

# 1. Configure SQLite in memory
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Overwrite the database dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# 3. Create TestClient
client = TestClient(app)

# 4. Fixture for creating/deleting tables before each test
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# --- TESTS ---

def test_create_classroom():
    response = client.post("/api/v1/classrooms/", json={
        "code": "TEST-101",
        "capacity": 20,
        "is_operational": True
    })
    assert response.status_code == 201
    data = response.json()
    assert data["code"] == "TEST-101"
    assert "id" in data

def test_create_duplicate_classroom_fails():
    # Create first time
    client.post("/api/v1/classrooms/", json={"code": "A1", "capacity": 10})
    # Create second time (should fail)
    response = client.post("/api/v1/classrooms/", json={"code": "A1", "capacity": 10})
    assert response.status_code == 409