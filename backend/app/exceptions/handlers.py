from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import uuid
from app.schemas.common import error_response
from app.core.logging import logger

class BusinessException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

def add_exception_handlers(app: FastAPI):
    
    @app.exception_handler(BusinessException)
    async def business_exception_handler(request: Request, exc: BusinessException):
        logger.warning(f"Business rule violation: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(message=exc.message).model_dump()
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = {}
        for err in exc.errors():
            loc = "->".join([str(l) for l in err["loc"]])
            errors[loc] = err["msg"]
            
        logger.warning(f"Validation error on {request.url.path}: {errors}")
        return JSONResponse(
            status_code=422,
            content=error_response(message="Validation failed", errors=errors).model_dump()
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        error_id = str(uuid.uuid4())
        logger.error(f"[ErrID: {error_id}] Database error: {str(exc)}")
        # Never expose raw DB errors to the client
        return JSONResponse(
            status_code=500,
            content=error_response(message="A database error occurred. Please contact support.", errors={"error_id": error_id}).model_dump()
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        error_id = str(uuid.uuid4())
        logger.error(f"[ErrID: {error_id}] Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=error_response(message="An unexpected server error occurred. Please contact support.", errors={"error_id": error_id}).model_dump()
        )
