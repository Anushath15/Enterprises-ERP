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

def test_create_category(test_db):
    response = client.post("/api/v1/categories", json={"name": "Electronics"})
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert response.json()["data"]["name"] == "Electronics"

def test_create_brand(test_db):
    response = client.post("/api/v1/brands", json={"name": "Sony"})
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert response.json()["data"]["name"] == "Sony"

def test_create_product(test_db):
    cat_res = client.post("/api/v1/categories", json={"name": "Electronics"})
    cat_id = cat_res.json()["data"]["id"]
    
    brand_res = client.post("/api/v1/brands", json={"name": "Sony"})
    brand_id = brand_res.json()["data"]["id"]
    
    product_data = {
        "name": "Sony TV",
        "category_id": cat_id,
        "brand_id": brand_id,
        "purchase_price": 500.0,
        "selling_price": 600.0,
        "current_stock": 50.0
    }
    
    response = client.post("/api/v1/products", json=product_data)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Sony TV"
    assert data["product_code"].startswith("PRD-")
    assert data["current_stock"] == 50.0

def test_list_products(test_db):
    test_create_product(test_db)
    
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert response.json()["meta"]["total_items"] == 1
