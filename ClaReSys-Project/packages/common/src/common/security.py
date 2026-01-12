import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel

class TokenData(BaseModel):
    user_id: str | None = None
    role: str | None = None

# This tells FastAPI where to look for the token (in the Authorization: Bearer header...)
# Note: The URL is for reference purposes only; it doesn't actually need to exist in each service.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set")

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Middleware that validates the JWT token.
    If valid, it returns the user's data.
    If not, it returns a 401 Unauthorized error.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id is None:
            raise credentials_exception
            
        return TokenData(user_id=user_id, role=role)
        
    except JWTError:
        raise credentials_exception

# Dependency to be used in FastAPI routes
RequireUser = Depends(get_current_user)