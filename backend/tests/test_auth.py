import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import SessionLocal
from app.database.base import Base
from app.api.dependencies import get_db
from app.security.password import get_password_hash
from app.models.user import User

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
client = TestClient(app)

@pytest.fixture
def test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Seed users
    db = TestingSessionLocal()
    admin = User(username="admin", hashed_password=get_password_hash("password"), role="Admin")
    inactive = User(username="old_user", hashed_password=get_password_hash("password"), role="Sales", is_active=False)
    db.add_all([admin, inactive])
    db.commit()
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)

def test_valid_login(test_db):
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "password"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "Admin"
    assert len(data["user"]["permissions"]) > 0

def test_invalid_password(test_db):
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrong"})
    assert res.status_code == 401

def test_invalid_username(test_db):
    res = client.post("/api/v1/auth/login", json={"username": "nobody", "password": "password"})
    assert res.status_code == 401

def test_inactive_user_login(test_db):
    res = client.post("/api/v1/auth/login", json={"username": "old_user", "password": "password"})
    assert res.status_code == 403
    assert "Inactive user" in res.json()["error"]["message"]

def test_protected_endpoint(test_db):
    # Without token
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    
    # With token
    login_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "password"})
    token = login_res.json()["data"]["access_token"]
    
    res2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    assert res2.json()["data"]["username"] == "admin"
