from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class UserBase(BaseModel):
    email:str
    password:str
    role: Optional[str] = "STUDENT"
    is_active: bool =True

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID
    
    class Config:
        from_attributes = True