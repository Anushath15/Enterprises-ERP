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

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    admin = User(username="integration_admin", hashed_password=get_password_hash("password"), role="Admin")
    db.add(admin)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def auth_headers(setup_db):
    res = client.post("/api/v1/auth/login", json={"username": "integration_admin", "password": "password"})
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_sales_and_purchase_workflow(auth_headers):
    # 1. Create Product
    prod_res = client.post("/api/v1/products/", json={
        "name": "Integration Product",
        "sku": "INT-01",
        "selling_price": 1500,
        "stock": 0,
        "min_stock": 5
    }, headers=auth_headers)
    assert prod_res.status_code == 200
    product = prod_res.json()["data"]
    prod_id = product["id"]

    # 2. Create Dealer
    dlr_res = client.post("/api/v1/contacts/dealers/", json={
        "name": "Integration Dealer",
        "phone": "9999999999",
        "outstanding": 0
    }, headers=auth_headers)
    dealer_id = dlr_res.json()["data"]["id"]

    # 3. Purchase Inventory
    purch_res = client.post("/api/v1/purchases/", json={
        "dealer_id": dealer_id,
        "payment_status": "Credit",
        "total_amount": 10000,
        "amount_paid": 2000,
        "items": [
            {"product_id": prod_id, "qty": 10, "unit_price": 1000, "total_price": 10000}
        ]
    }, headers=auth_headers)
    assert purch_res.status_code == 200

    # Verify Stock is 10
    chk_prod = client.get(f"/api/v1/products/{prod_id}", headers=auth_headers).json()["data"]
    assert chk_prod["stock"] == 10

    # Verify Dealer Balance is 8000
    chk_dlr = client.get(f"/api/v1/contacts/dealers/{dealer_id}", headers=auth_headers).json()["data"]
    assert chk_dlr["outstanding"] == 8000

    # 4. Create Customer
    cus_res = client.post("/api/v1/contacts/customers/", json={
        "name": "Integration Customer",
        "phone": "8888888888",
        "outstanding": 0,
        "credit_limit": 50000
    }, headers=auth_headers)
    cus_id = cus_res.json()["data"]["id"]

    # 5. Sell Product
    sale_res = client.post("/api/v1/sales/", json={
        "customer_id": cus_id,
        "payment_status": "Credit",
        "total_amount": 3000,
        "amount_paid": 500,
        "items": [
            {"product_id": prod_id, "qty": 2, "unit_price": 1500, "total_price": 3000}
        ]
    }, headers=auth_headers)
    assert sale_res.status_code == 200

    # Verify Stock is 8
    chk_prod2 = client.get(f"/api/v1/products/{prod_id}", headers=auth_headers).json()["data"]
    assert chk_prod2["stock"] == 8

    # Verify Customer Balance is 2500
    chk_cus = client.get(f"/api/v1/contacts/customers/{cus_id}", headers=auth_headers).json()["data"]
    assert chk_cus["outstanding"] == 2500

    # 6. Verify Dashboard/Reports (Daily Closing)
    rep_res = client.get("/api/v1/reports/sales", headers=auth_headers).json()["data"]
    assert len(rep_res) > 0

def test_insufficient_stock_rollback(auth_headers):
    # Try to sell 100 items (we only have 8)
    prod_id = 1 # from previous test
    sale_res = client.post("/api/v1/sales/", json={
        "customer_id": 1,
        "payment_status": "Paid Full",
        "total_amount": 150000,
        "amount_paid": 150000,
        "items": [
            {"product_id": prod_id, "qty": 100, "unit_price": 1500, "total_price": 150000}
        ]
    }, headers=auth_headers)
    
    assert sale_res.status_code == 400
    assert "Insufficient stock" in sale_res.json()["error"]["message"]

    # Verify DB Integrity - Stock should still be 8
    chk_prod = client.get(f"/api/v1/products/{prod_id}", headers=auth_headers).json()["data"]
    assert chk_prod["stock"] == 8
