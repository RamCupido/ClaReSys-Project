import uuid
from sqlalchemy import Column, String, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from src.config.database import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    location_details = Column(String, nullable=True)
    is_operational = Column(Boolean, default=True)