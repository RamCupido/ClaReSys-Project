from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ClassroomBase(BaseModel):
    code: str
    capacity: int
    location_details: Optional[str] = None
    is_operational: bool = True

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomResponse(ClassroomBase):
    id: UUID

    class Config:
        from_attributes = True