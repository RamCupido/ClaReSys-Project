from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from src.utils.security import verify_password, create_access_token
from src.gateways.user_gateway import UserGateway

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(request: LoginRequest):
    gateway = UserGateway()
    try:
        user = gateway.get_user_by_email(request.email)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail="Servicio de usuario no disponible")
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas (Usuario no encontrado)")
    
    if hasattr(user, "found") and not user.found:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas (Usuario no encontrado)")

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas (Password erróneo)")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": str(user.id),
        "role": user.role
    }