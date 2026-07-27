import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import SessionLocal
from app.database.base import Base
from app.api.dependencies import get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

from app.security.current_user import get_current_active_user
from app.models.user import User
from app.security.permissions import Role

def override_get_current_active_user():
    return User(id=999, username="testadmin", role=Role.ADMIN, is_active=True, hashed_password="")

app.dependency_overrides[get_current_active_user] = override_get_current_active_user
client = TestClient(app)

@pytest.fixture
def test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_customer(test_db):
    response = client.post("/api/v1/customers", json={"name": "Rajesh Kumar", "phone": "9876543210"})
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert response.json()["data"]["name"] == "Rajesh Kumar"
    assert response.json()["data"]["outstanding_balance"] == 0.0

def test_duplicate_customer_phone(test_db):
    client.post("/api/v1/customers", json={"name": "Rajesh", "phone": "9876543210"})
    response = client.post("/api/v1/customers", json={"name": "Kumar", "phone": "9876543210"})
    assert response.status_code == 409

def test_create_dealer(test_db):
    response = client.post("/api/v1/dealers", json={"name": "Tech Corp", "phone": "1234567890"})
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert response.json()["data"]["name"] == "Tech Corp"

def test_list_contacts(test_db):
    test_create_customer(test_db)
    response = client.get("/api/v1/customers")
    assert response.status_code == 200
    assert response.json()["meta"]["total_items"] == 1
