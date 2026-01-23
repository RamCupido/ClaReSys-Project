from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

TicketType = Literal["PROYECTOR", "RED", "INFRAESTRUCTURA", "ELECTRICO", "OTRO"]
Priority = Literal["BAJO", "MEDIO", "ALTO", "CRITICO"]
Status = Literal["ABIERTO", "EN_PROCESO", "RESUELTO", "CANCELADO"]

class MaintenanceTicketCreate(BaseModel):
    classroom_id: str
    reported_by_user_id: str
    type: TicketType = "OTRO"
    priority: Priority = "MEDIO"
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
