import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from src.app.api.dependencies.common import SessionDep, TokenDep
from src.app.core import security
from src.app.core.settings import get_project_settings
from src.app.crud import user as user_crud
from src.app.db.models.user import Role, User
from src.app.db.schemas import TokenPayload

project_settings = get_project_settings()

async def get_current_user(
    session: SessionDep,
    token: TokenDep,
) -> User:
    try:
        payload = jwt.decode(
            token,
            project_settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=403,
            detail="Could not validate credentials",
        )
    user = await session.get(User, token_data.sub)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    return user


async def get_optional_user(
    session: SessionDep,
    token: str | None = Depends(
        OAuth2PasswordBearer(
            tokenUrl="login",
            auto_error=False,
        ),
    ),
) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            project_settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        token_data = TokenPayload(**payload)
    except (ValidationError):
        return None
    return await session.get(User, token_data.sub)


async def get_user_or_404(
    session: SessionDep,
    user_id: uuid.UUID,
) -> User:
    user = await user_crud.get_user(
        session=session,
        id=user_id,
    )
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    return user


UserOr404 = Annotated[User, Depends(get_user_or_404)]
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[
    User | None,
    Depends(get_optional_user),
]

async def get_current_admin(
    current_user: CurrentUser,
) -> User:
    if not current_user.role == Role.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return current_user

async def verify_user_ownership(
    current_user: CurrentUser,
    user_id: uuid.UUID,
) -> None:
    """Проверяет, что текущий пользователь имеет доступ к ресурсу"""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this resource",
        )


async def verify_role_permission(
    current_user: CurrentUser,
    user: User,
) -> None:
    """Проверяет, что текущий пользователь имеет доступ к ресурсу"""
    if current_user.role < user.role:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this resource",
        )
