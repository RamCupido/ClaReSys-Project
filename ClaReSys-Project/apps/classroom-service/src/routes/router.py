from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.config.database import get_db
from src.models.classroom import Classroom
from src.schemas.classroom import ClassroomCreate, ClassroomResponse, ClassroomUpdate

router = APIRouter()

@router.post("/", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(payload: ClassroomCreate, db: Session = Depends(get_db)):
    code = payload.code.strip().upper()

    new_classroom = Classroom(
        code=code,
        capacity=payload.capacity,
        location_details=payload.location_details,
        is_operational=payload.is_operational,
    )

    db.add(new_classroom)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Classroom code already registered")

    db.refresh(new_classroom)
    return new_classroom

@router.get("/", response_model=list[ClassroomResponse])
def list_classrooms(
    skip: int = 0,
    limit: int = 100,
    only_operational: bool | None = None,
    db: Session = Depends(get_db)
):
    q = db.query(Classroom)
    if only_operational is True:
        q = q.filter(Classroom.is_operational.is_(True))
    return q.offset(skip).limit(limit).all()

@router.get("/{classroom_id}", response_model=ClassroomResponse)
def get_classroom(classroom_id: UUID, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter_by(id=classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    return classroom

@router.patch("/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(classroom_id: UUID, payload: ClassroomUpdate, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter_by(id=classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    data = payload.model_dump(exclude_unset=True)
    if "code" in data and data["code"] is not None:
        data["code"] = data["code"].strip().upper()

    for key, value in data.items():
        setattr(classroom, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Classroom code already registered")

    db.refresh(classroom)
    return classroom

@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(classroom_id: UUID, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    db.delete(classroom)
    db.commit()
    return None