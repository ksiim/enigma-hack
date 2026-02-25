from datetime import datetime, timedelta

import jwt
from passlib.context import CryptContext

from src.app.core.settings import get_project_settings

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

project_settings = get_project_settings()

def create_access_token(subject: str, expires_delta: timedelta) -> str:
    expire = datetime.now() + expires_delta
    to_encode = {"exp": expire, "sub": subject}
    encoded_jwt = jwt.encode(to_encode, project_settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
