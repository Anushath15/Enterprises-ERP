from fastapi import APIRouter, Depends, Request, HTTPException
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

import time

router = APIRouter()

# Simple in-memory rate limiter for login
login_attempts = {}
MAX_ATTEMPTS = 5
LOCKOUT_WINDOW = 300 # 5 minutes

@router.post("/login", response_model=StandardResponse[TokenData])
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}_{login_data.username}"
    
    current_time = time.time()
    attempt_record = login_attempts.get(key, {"count": 0, "first_attempt": current_time})
    
    if current_time - attempt_record["first_attempt"] > LOCKOUT_WINDOW:
        attempt_record = {"count": 0, "first_attempt": current_time}
        
    if attempt_record["count"] >= MAX_ATTEMPTS:
        audit_repo.create(db, obj_in={
            "action": "LOGIN_RATE_LIMIT",
            "entity_type": "Security",
            "entity_id": 0,
            "details": f"Rate limit exceeded for {login_data.username} from {client_ip}"
        })
        db.commit()
        raise BusinessException("Too many login attempts. Try again later.", status_code=429)
        
    try:
        auth_data = AuthService.authenticate_user(db, login_data)
        
        # Reset on success
        login_attempts.pop(key, None)
        
        audit_repo.create(db, obj_in={
            "action": "LOGIN_SUCCESS",
            "entity_type": "User",
            "entity_id": auth_data.user.id,
            "details": f"Successful login from {client_ip}"
        })
        db.commit()
        return success_response(data=auth_data, message="Login successful")
        
    except BusinessException as e:
        attempt_record["count"] += 1
        login_attempts[key] = attempt_record
        
        audit_repo.create(db, obj_in={
            "action": "LOGIN_FAILED",
            "entity_type": "User",
            "entity_id": 0,
            "details": f"Failed login for {login_data.username} from {client_ip}"
        })
        db.commit()
        raise e

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
