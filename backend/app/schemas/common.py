from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, Generic, Optional, TypeVar, List

T = TypeVar('T')

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int

class StandardResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    errors: Optional[Dict[str, Any]] = None
    meta: Optional[PaginationMeta] = None
    
    model_config = ConfigDict(from_attributes=True)

def success_response(data: Any = None, message: str = "Operation successful", meta: Optional[PaginationMeta] = None) -> StandardResponse:
    return StandardResponse(
        success=True,
        message=message,
        data=data,
        errors=None,
        meta=meta
    )

def error_response(message: str, errors: Optional[Dict[str, Any]] = None) -> StandardResponse:
    return StandardResponse(
        success=False,
        message=message,
        data=None,
        errors=errors,
        meta=None
    )
