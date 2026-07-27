from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
from app.models.user import User
from app.repositories.product import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        stmt = select(User).filter(User.username == username)
        return db.execute(stmt).scalar_one_or_none()

user_repo = UserRepository()
