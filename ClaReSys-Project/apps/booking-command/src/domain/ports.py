from abc import ABC, abstractmethod
from uuid import UUID
from datetime import datetime
from typing import List, Tuple

class ClassroomGateway(ABC):
    """Port to verify classroom existence"""
    @abstractmethod
    def exists(self, classroom_id: UUID) -> bool:
        pass

class TimetableGateway(ABC):
    """Port to verify timetable conflicts"""
    @abstractmethod
    def check_availability(self, start: datetime, end: datetime, existing_bookings: List[Tuple[datetime, datetime]]) -> bool:
        pass

class EventBusGateway(ABC):
    @abstractmethod
    def publish(self, event_type: str, payload: dict):
        pass