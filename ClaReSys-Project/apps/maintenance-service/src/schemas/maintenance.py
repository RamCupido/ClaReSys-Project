from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

TicketType = Literal["PROJECTOR", "NETWORK", "CLEANING", "ELECTRICAL", "OTHER"]
Priority = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
Status = Literal["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"]

class MaintenanceTicketCreate(BaseModel):
    classroom_id: str
    reported_by_user_id: str
    type: TicketType = "OTHER"
    priority: Priority = "MEDIUM"
    description: str = Field(min_length=3, max_length=2000)

class MaintenanceTicketUpdate(BaseModel):
    # patch parcial
    assigned_to_user_id: Optional[str] = None
    type: Optional[TicketType] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    description: Optional[str] = Field(default=None, min_length=3, max_length=2000)

class MaintenanceTicketOut(BaseModel):
    id: str
    ticket_id: str
    classroom_id: str
    reported_by_user_id: str
    assigned_to_user_id: Optional[str] = None

    type: TicketType
    priority: Priority
    status: Status

    description: str

    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
