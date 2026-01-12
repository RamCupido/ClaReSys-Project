from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    
    @classmethod
    def success_response(cls, data: T, message: str = "Operation successful"):
        return cls(success=True, message=message, data=data)

    @classmethod
    def error_response(cls, message: str):
        return cls(success=False, message=message, data=None)