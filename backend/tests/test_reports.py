import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date

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

def setup_data():
    # customer
    c_res = client.post("/api/v1/customers", json={"name": "Report Cust", "phone": "112233"})
    c_id = c_res.json()["data"]["id"]
    
    # dealer
    d_res = client.post("/api/v1/dealers", json={"name": "Report Dealer", "phone": "332211"})
    d_id = d_res.json()["data"]["id"]
    
    # category & product
    cat_id = client.post("/api/v1/categories", json={"name": "R-Cat"}).json()["data"]["id"]
    brand_id = client.post("/api/v1/brands", json={"name": "R-Brand"}).json()["data"]["id"]
    p_id = client.post("/api/v1/products", json={
        "name": "R-Prod", "category_id": cat_id, "brand_id": brand_id, 
        "purchase_price": 100, "selling_price": 150, "gst_percentage": 5, "current_stock": 50, "minimum_stock": 10
    }).json()["data"]["id"]
    
    # sales (credit to test outstanding)
    client.post("/api/v1/sales", json={
        "customer_id": c_id, "payment_type": "Credit", "discount": 0,
        "items": [{"product_id": p_id, "quantity": 10, "unit_price": 150.0}]
    })
    
    # purchase (credit to test outstanding)
    client.post("/api/v1/purchases", json={
        "dealer_id": d_id, "payment_type": "Credit", "discount": 0,
        "items": [{"product_id": p_id, "quantity": 5, "unit_price": 100.0}]
    })

def test_sales_report(test_db):
    setup_data()
    res = client.get("/api/v1/reports/sales")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 1
    assert data[0]["total_sales"] == 1500.0 # 10 * 150
    assert data[0]["invoice_count"] == 1

def test_purchases_report(test_db):
    setup_data()
    res = client.get("/api/v1/reports/purchases")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 1
    assert data[0]["total_purchases"] == 500.0 # 5 * 100

def test_inventory_report(test_db):
    setup_data()
    res = client.get("/api/v1/reports/inventory")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) == 1
    # initial 50, sold 10, bought 5 -> 45
    assert data[0]["current_stock"] == 45.0
    
def test_outstanding_reports(test_db):
    setup_data()
    
    res_c = client.get("/api/v1/reports/customers")
    assert res_c.status_code == 200
    # Sales Total with 5% tax = 1500 + 75 = 1575
    assert res_c.json()["data"][0]["outstanding_balance"] == 1575.0
    
    res_d = client.get("/api/v1/reports/dealers")
    assert res_d.status_code == 200
    # Purchase Total with 5% tax = 500 + 25 = 525
    assert res_d.json()["data"][0]["outstanding_balance"] == 525.0

def test_date_validation():
    res = client.get("/api/v1/reports/sales?start_date=2026-02-01&end_date=2026-01-01")
    assert res.status_code == 400
    assert "start_date cannot be after end_date" in res.json()["error"]["message"]
