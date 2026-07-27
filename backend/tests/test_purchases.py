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

def setup_test_data():
    cat_id = client.post("/api/v1/categories", json={"name": "Electronics"}).json()["data"]["id"]
    brand_id = client.post("/api/v1/brands", json={"name": "Sony"}).json()["data"]["id"]
    
    product_res = client.post("/api/v1/products", json={
        "name": "Sony TV",
        "category_id": cat_id,
        "brand_id": brand_id,
        "purchase_price": 500.0,
        "selling_price": 600.0,
        "gst_percentage": 10.0,
        "current_stock": 10.0
    })
    product_id = product_res.json()["data"]["id"]
    
    dealer_res = client.post("/api/v1/dealers", json={
        "name": "Sony Distributor",
        "phone": "9876543210"
    })
    dealer_id = dealer_res.json()["data"]["id"]
    
    return product_id, dealer_id

def test_create_purchase_invoice_cash(test_db):
    product_id, dealer_id = setup_test_data()
    
    invoice_data = {
        "dealer_id": dealer_id,
        "payment_type": "Cash",
        "discount": 0.0,
        "items": [
            {"product_id": product_id, "quantity": 5, "unit_price": 500.0}
        ]
    }
    
    response = client.post("/api/v1/purchases", json=invoice_data)
    assert response.status_code == 201
    
    data = response.json()["data"]
    assert data["subtotal"] == 2500.0
    assert data["tax_total"] == 250.0
    assert data["total_amount"] == 2750.0
    assert data["payment_status"] == "Paid"
    
    # Verify stock increased
    product = client.get(f"/api/v1/products/{product_id}").json()["data"]
    assert product["current_stock"] == 15.0 # Initial 10 + 5
    
    # Verify dealer balance unchanged
    dealer = client.get(f"/api/v1/dealers/{dealer_id}").json()["data"]
    assert dealer["outstanding_balance"] == 0.0

def test_create_purchase_invoice_credit(test_db):
    product_id, dealer_id = setup_test_data()
    
    invoice_data = {
        "dealer_id": dealer_id,
        "payment_type": "Credit",
        "discount": 50.0,
        "items": [
            {"product_id": product_id, "quantity": 10, "unit_price": 500.0}
        ]
    }
    
    response = client.post("/api/v1/purchases", json=invoice_data)
    assert response.status_code == 201
    
    data = response.json()["data"]
    assert data["subtotal"] == 5000.0
    assert data["tax_total"] == 500.0
    assert data["total_amount"] == 5450.0
    
    # Verify dealer balance increased
    dealer = client.get(f"/api/v1/dealers/{dealer_id}").json()["data"]
    assert dealer["outstanding_balance"] == 5450.0
    
    # Verify stock increased
    product = client.get(f"/api/v1/products/{product_id}").json()["data"]
    assert product["current_stock"] == 20.0
