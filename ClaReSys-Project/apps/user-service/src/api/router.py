from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from src.config.database import get_db
from src.models.user import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "STUDENT"

class UserResponse(BaseModel):
    id: str
    email: str
    role: str

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # --- DEBUG ---
    print(f"DEBUG: Longitud del password recibido: {len(user.password)}")
    print(f"DEBUG: Password recibido (primeros 10 chars): {user.password[:10]}...")
    # -------------
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = User(email=user.email, password_hash=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"id": str(new_user.id), "email": new_user.email, "role": new_user.role}