from sqlalchemy.orm import Session
from app.schemas.auth import LoginRequest
from app.repositories.user import user_repo
from app.repositories.sales import audit_repo
from app.security.password import verify_password
from app.security.jwt import create_access_token
from app.security.permissions import get_role_permissions
from app.core.config import settings
from app.exceptions.handlers import BusinessException

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> dict:
        user = user_repo.get_by_username(db, username=login_data.username)
        if not user:
            audit_repo.create(db, obj_in={
                "action": "LOGIN_FAILED",
                "entity_type": "User",
                "entity_id": 0,
                "details": f"Failed login attempt for username: {login_data.username}"
            })
            db.commit()
            raise BusinessException("Invalid username or password", status_code=401)
            
        if not verify_password(login_data.password, user.hashed_password):
            audit_repo.create(db, obj_in={
                "action": "LOGIN_FAILED",
                "entity_type": "User",
                "entity_id": user.id,
                "details": f"Failed login attempt for username: {login_data.username}"
            })
            db.commit()
            raise BusinessException("Invalid username or password", status_code=401)
            
        if not user.is_active:
            raise BusinessException("Inactive user cannot log in", status_code=403)
            
        # Create token
        access_token = create_access_token(data={"sub": user.username})
        
        audit_repo.create(db, obj_in={
            "action": "LOGIN_SUCCESS",
            "entity_type": "User",
            "entity_id": user.id,
            "details": f"User {user.username} logged in successfully"
        })
        db.commit()
        
        permissions = get_role_permissions(user.role)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role.value,
                "permissions": permissions,
                "is_active": user.is_active
            }
        }
