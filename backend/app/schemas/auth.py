from pydantic import BaseModel
from app.schemas.user import UserWithPermissions

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserWithPermissions

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
