from typing import Generator
from app.database.session import SessionLocal

def get_db() -> Generator:
    """
    Dependency function to yield database sessions.
    Automatically closes the session when the request is complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
