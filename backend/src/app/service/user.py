from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import verify_password
from src.app.core.settings import get_project_settings
from src.app.crud import user as user_crud
from src.app.db.models.user import User, UserCreate, UserPublic, UsersPublic, UserUpdate

project_settings = get_project_settings()

async def authenticate(*, session: AsyncSession, email: str, password: str) -> User | None:
    db_user = await user_crud.get_user(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user

async def get_user(
    session: AsyncSession,
    **filters: Any,
) -> UserPublic | None:
    if not (user := await user_crud.get_user(session, **filters)):
        return None
    return UserPublic.model_validate(user)

async def get_users(
    session: AsyncSession,
    skip: int = 0,
    limit: int = project_settings.DEFAULT_QUERY_LIMIT,
) -> UsersPublic:
    users = await user_crud.get_users(session, skip, limit)
    return UsersPublic(
        data=[UserPublic.model_validate(user) for user in users],
        count=len(users),
    )

async def create_user(
    session: AsyncSession,
    user_in: UserCreate,
) -> UserPublic:
    return UserPublic.model_validate(
        await user_crud.create_user(
            session=session,
            user_create=user_in,
        ),
    )

async def update_user(
    session: AsyncSession,
    db_user: User,
    user_in: UserUpdate,
) -> UserPublic:
    return UserPublic.model_validate(
        await user_crud.update_user(
            session=session,
            db_user=db_user,
            user_in=user_in,
        ),
    )

async def delete_user(session: AsyncSession,user_in: User) -> bool:
    return await user_crud.delete_user(session, user_in)
