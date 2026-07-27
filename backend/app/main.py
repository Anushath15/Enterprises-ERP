from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.exceptions.handlers import add_exception_handlers

# Initialize FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Senthil Enterprises Backend API"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom exception handlers
add_exception_handlers(app)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} (Version: {settings.VERSION})")
    logger.info(f"Active Timezone: {settings.TIMEZONE}")

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "API is running."}

from fastapi import APIRouter, Depends
from app.api.v1 import products, contacts, sales, purchases, expenses, daily_closing, dashboard, reports, auth
from app.security.current_user import get_current_active_user

api_v1_router = APIRouter()

# Auth is public
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Protected Business Routes
protected_deps = [Depends(get_current_active_user)]

api_v1_router.include_router(products.router, tags=["Products"], dependencies=protected_deps)
api_v1_router.include_router(contacts.router, tags=["Contacts"], dependencies=protected_deps)
api_v1_router.include_router(sales.router, prefix="/sales", tags=["Sales"], dependencies=protected_deps)
api_v1_router.include_router(purchases.router, prefix="/purchases", tags=["Purchases"], dependencies=protected_deps)
api_v1_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"], dependencies=protected_deps)
api_v1_router.include_router(daily_closing.router, prefix="/daily-closing", tags=["Daily Closing"], dependencies=protected_deps)
api_v1_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"], dependencies=protected_deps)
api_v1_router.include_router(reports.router, prefix="/reports", tags=["Reports"], dependencies=protected_deps)

app.include_router(api_v1_router, prefix=settings.API_V1_STR)
