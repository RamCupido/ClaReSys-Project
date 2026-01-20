from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

AuditStatus = Literal["SUCCESS", "FAIL"]

class AuditLogIn(BaseModel):
    timestamp: datetime
    service: str
    action: str
    status: AuditStatus

    actor_user_id: Optional[str] = None
    role: Optional[str] = None

    resource_type: Optional[str] = None
    resource_id: Optional[str] = None

    correlation_id: Optional[str] = None
    ip: Optional[str] = None

    payload: dict[str, Any] = Field(default_factory=dict)

class AuditLogOut(AuditLogIn):
    id: str
