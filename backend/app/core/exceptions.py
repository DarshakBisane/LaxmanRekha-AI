from typing import Any, Optional
from fastapi import HTTPException, status

class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Any] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)

class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(code="NOT_FOUND", message=message, status_code=status.HTTP_404_NOT_FOUND, details=details)

class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required", details: Optional[Any] = None):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=status.HTTP_401_UNAUTHORIZED, details=details)

class ForbiddenError(AppError):
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Any] = None):
        super().__init__(code="FORBIDDEN", message=message, status_code=status.HTTP_403_FORBIDDEN, details=details)

class ValidationError(AppError):
    def __init__(self, message: str = "Invalid input data", details: Optional[Any] = None):
        super().__init__(code="VALIDATION_FAILED", message=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)

class RateLimitError(AppError):
    def __init__(self, message: str = "Rate limit exceeded. Please try again later.", details: Optional[Any] = None):
        super().__init__(code="RATE_LIMIT_EXCEEDED", message=message, status_code=status.HTTP_429_TOO_MANY_REQUESTS, details=details)

class ProcessingError(AppError):
    def __init__(self, message: str = "Document processing failed", details: Optional[Any] = None):
        super().__init__(code="PROCESSING_ERROR", message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)
