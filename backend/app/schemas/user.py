from pydantic import BaseModel, ConfigDict
from typing import List
from app.security.permissions import Role

class UserBase(BaseModel):
    username: str
    role: Role

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class UserWithPermissions(UserResponse):
    permissions: List[str]
