from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from src.utils.security import verify_password, create_access_token
from src.gateways.user_gateway import UserGateway

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str

def get_user_gateway():
    return UserGateway()

@router.post("/login", response_model=Token)
def login(request: LoginRequest, user_gateway: UserGateway = Depends(get_user_gateway)):
    
    user = user_gateway.get_user_by_email(request.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas (Usuario no encontrado)")
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas (Password erróneo)")
        
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role
    }