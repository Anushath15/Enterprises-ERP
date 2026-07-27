from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import BaseModel
from app.security.permissions import Role

class User(BaseModel):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(String(50), nullable=False, default=Role.SALES)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
