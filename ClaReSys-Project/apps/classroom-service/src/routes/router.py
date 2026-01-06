from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.classroom import Classroom
from src.schemas.classroom import ClassroomCreate, ClassroomResponse

router = APIRouter()

@router.post("/", response_model=ClassroomResponse)
def create_classroom(classroom: ClassroomCreate, db: Session = Depends(get_db)):
    # Verificar si el código ya existe
    db_classroom = db.query(Classroom).filter(Classroom.code == classroom.code).first()
    if db_classroom:
        raise HTTPException(status_code=400, detail="Classroom code already registered")
    
    # Crear nueva aula
    new_classroom = Classroom(**classroom.model_dump())
    db.add(new_classroom)
    db.commit()
    db.refresh(new_classroom)
    return new_classroom

@router.get("/", response_model=list[ClassroomResponse])
def read_classrooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    classrooms = db.query(Classroom).offset(skip).limit(limit).all()
    return classrooms