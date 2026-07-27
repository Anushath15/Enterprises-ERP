import pytest
from datetime import date
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

def test_expense_creation(test_db):
    cat_res = client.post("/api/v1/expenses/categories", json={"name": "Tea & Snacks"})
    cat_id = cat_res.json()["data"]["id"]
    
    today_str = date.today().isoformat()
    expense_res = client.post("/api/v1/expenses", json={
        "category_id": cat_id,
        "amount": 150.0,
        "payment_method": "Cash",
        "expense_date": today_str
    })
    
    assert expense_res.status_code == 201
    data = expense_res.json()["data"]
    assert data["amount"] == 150.0
    assert "EXP-" in data["expense_number"]

def test_daily_closing_calculation(test_db):
    # Create Expense
    cat_id = client.post("/api/v1/expenses/categories", json={"name": "Office Supplies"}).json()["data"]["id"]
    today_str = date.today().isoformat()
    client.post("/api/v1/expenses", json={
        "category_id": cat_id,
        "amount": 500.0,
        "payment_method": "Cash",
        "expense_date": today_str
    })
    
    # We do a closing with 1000 physical cash.
    # Expected cash should be: 0 (Sales) - 0 (Purchases) - 500 (Expenses) = -500.
    # Diff = 1000 - (-500) = 1500 (Excess)
    closing_res = client.post("/api/v1/daily-closing", json={
        "business_date": today_str,
        "physical_cash": 1000.0
    })
    
    assert closing_res.status_code == 201
    data = closing_res.json()["data"]
    
    assert data["cash_expenses"] == 500.0
    assert data["expected_cash"] == -500.0
    assert data["physical_cash"] == 1000.0
    assert data["difference"] == 1500.0
    assert data["status"] == "Excess"

def test_duplicate_daily_closing(test_db):
    today_str = date.today().isoformat()
    client.post("/api/v1/daily-closing", json={
        "business_date": today_str,
        "physical_cash": 0.0
    })
    
    # Duplicate
    res2 = client.post("/api/v1/daily-closing", json={
        "business_date": today_str,
        "physical_cash": 0.0
    })
    assert res2.status_code == 409

def test_dashboard_summary(test_db):
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_sales_today" in data
    assert "total_expenses_today" in data
