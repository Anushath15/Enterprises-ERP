from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response
from app.schemas.auth import LoginRequest, TokenData, ChangePasswordRequest
from app.schemas.user import UserWithPermissions
from app.services.auth import AuthService
from app.security.current_user import get_current_active_user
from app.security.permissions import get_role_permissions
from app.models.user import User
from app.repositories.sales import audit_repo
from app.security.password import verify_password, get_password_hash
from app.exceptions.handlers import BusinessException

router = APIRouter()

@router.post("/login", response_model=StandardResponse[TokenData])
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    auth_data = AuthService.authenticate_user(db, login_data)
    return success_response(data=auth_data, message="Login successful")

@router.post("/logout", response_model=StandardResponse[dict])
def logout(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Since JWT is stateless, logout is handled client-side by deleting token.
    # We just log it for audit.
    audit_repo.create(db, obj_in={
        "action": "LOGOUT",
        "entity_type": "User",
        "entity_id": current_user.id,
        "details": f"User {current_user.username} logged out"
    })
    db.commit()
    return success_response(data={}, message="Logout successful")

@router.get("/me", response_model=StandardResponse[UserWithPermissions])
def get_me(current_user: User = Depends(get_current_active_user)):
    user_dict = {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "permissions": get_role_permissions(current_user.role)
    }
    return success_response(data=user_dict)

@router.post("/change-password", response_model=StandardResponse[dict])
def change_password(
    pwd_data: ChangePasswordRequest, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    if not verify_password(pwd_data.old_password, current_user.hashed_password):
        raise BusinessException("Invalid old password", status_code=400)
        
    current_user.hashed_password = get_password_hash(pwd_data.new_password)
    db.add(current_user)
    
    audit_repo.create(db, obj_in={
        "action": "PASSWORD_CHANGE",
        "entity_type": "User",
        "entity_id": current_user.id,
        "details": f"User {current_user.username} changed password"
    })
    
    db.commit()
    return success_response(data={}, message="Password changed successfully")
