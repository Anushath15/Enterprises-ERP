from pydantic_settings import BaseSettings, SettingsConfigDict
from decimal import Decimal

class Settings(BaseSettings):
    PROJECT_NAME: str = "Senthil Enterprises ERP API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./senthil_erp.db"
    
    # Business Rules
    DEFAULT_GST_RATE: Decimal = Decimal("18.0")
    DEFAULT_CURRENCY: str = "INR"
    TIMEZONE: str = "Asia/Kolkata"
    DECIMAL_PRECISION: int = 2
    
    # Prefixes
    PRODUCT_PREFIX: str = "PRD"
    CUSTOMER_PREFIX: str = "CUS"
    DEALER_PREFIX: str = "DLR"
    SALES_PREFIX: str = "SAL"
    PURCHASE_PREFIX: str = "PUR"
    EXPENSE_PREFIX: str = "EXP"
    
    # Security Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000"]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()

if settings.SECRET_KEY == "supersecretkey-change-me-in-production":
    import warnings
    warnings.warn("CRITICAL: Default SECRET_KEY is in use! Please set SECRET_KEY in your .env file.")
