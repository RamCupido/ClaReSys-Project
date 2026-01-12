from abc import ABC, abstractmethod
from uuid import UUID
from datetime import datetime
from typing import List, Tuple, Optional, Dict, Any

class ClassroomGateway(ABC):
    @abstractmethod
    def get_classroom(self, classroom_id: UUID) -> Optional[Dict[str, Any]]:
        pass

class TimetableGateway(ABC):
    @abstractmethod
    def check_availability(self, start: datetime, end: datetime, existing_bookings: List[Tuple[datetime, datetime]]) -> bool:
        pass

class EventBusGateway(ABC):
    @abstractmethod
    def publish(self, event_type: str, payload: dict):
        pass
