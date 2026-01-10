from pydantic import Field
from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ClassroomBase(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    capacity: int = Field(gt=0)
    location_details: Optional[str] = None
    is_operational: bool = True

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    capacity: Optional[int] = Field(default=None, gt=0)
    location_details: Optional[str] = None
    is_operational: Optional[bool] = None

class ClassroomResponse(ClassroomBase):
    id: UUID

    class Config:
        from_attributes = True