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
    SECRET_KEY: str = "supersecretkey-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days for MVP
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()
