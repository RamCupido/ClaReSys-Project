import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from src.infrastructure.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)      
    classroom_id = Column(UUID(as_uuid=True), nullable=False)
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    status = Column(String, default="CONFIRMED") # CONFIRMED, CANCELLED
    
    # En el futuro aquí agregaremos 'created_at' etc.