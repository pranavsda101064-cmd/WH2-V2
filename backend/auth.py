from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models import User

settings = get_settings()

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


# ---------- Schemas ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    email: str
    role: str


# ---------- Password utilities ----------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---------- JWT utilities ----------
def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------- Google ID Token Verification ----------
async def verify_google_id_token(id_token: str) -> dict:
    """Verify a Google ID token using Google's public JWKS keys."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_JWKS_URL, timeout=10.0)
        resp.raise_for_status()
        keys = resp.json().get("keys", [])

    last_error = None
    for key_data in keys:
        try:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
            payload = jwt.decode(
                id_token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            # Verify issuer
            iss = payload.get("iss", "")
            if iss not in ("accounts.google.com", "https://accounts.google.com"):
                raise ValueError(f"Invalid issuer: {iss}")
            # Verify audience matches our client ID
            aud = payload.get("aud", "")
            if settings.GOOGLE_WEB_CLIENT_ID and aud != settings.GOOGLE_WEB_CLIENT_ID:
                raise ValueError(f"Invalid audience: {aud}")
            return payload
        except Exception as exc:
            last_error = exc
            continue

    raise HTTPException(401, detail=f"Could not verify Google token: {last_error}")


# ---------- Dependency ----------
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Returns user if authenticated, None otherwise. Does not raise."""
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            return None
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except HTTPException:
        return None
