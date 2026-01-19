from pydantic import Field, BaseModel
from uuid import UUID
from typing import Optional

class ClassroomBase(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    capacity: int = Field(gt=0)
    location_details: Optional[str] = Field(default=None, max_length=255)
    is_operational: bool = True

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    capacity: Optional[int] = Field(default=None, gt=0, le=1000)
    location_details: Optional[str] = Field(default=None, max_length=255)
    is_operational: Optional[bool] = None

class ClassroomResponse(ClassroomBase):
    id: UUID
    code: str
    capacity: int
    location_details: Optional[str] = None
    is_operational: bool

    class Config:
        from_attributes = True