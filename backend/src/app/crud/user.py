from collections.abc import Sequence
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import get_password_hash
from src.app.core.settings import get_project_settings
from src.app.db.models.user import (
    User,
    UserCreate,
    UserUpdate,
)

project_settings = get_project_settings()


async def get_user(
    session: AsyncSession,
    **filters: Any,
) -> User | None:
    statement = select(User).filter_by(**filters)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    return user

async def create_user(
    session: AsyncSession,
    user_create: UserCreate,
) -> User:
    if await get_user(
        session=session,
        email=user_create.email,
    ):
        raise HTTPException(
            status_code=409,
            detail="Пользователь с таким email уже существует",
        )
    print(user_create.password)
    user = User.model_validate(
        user_create,
        update={
            "hashed_password": get_password_hash(user_create.password),
        },
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def get_users(
    session: AsyncSession,
    skip: int = 0,
    limit: int = project_settings.DEFAULT_QUERY_LIMIT,
) -> Sequence[User]:
    statement = select(User).offset(skip).limit(limit)
    users = (await session.execute(
        statement,
    )).scalars().all()
    return users

async def delete_user(
    session: AsyncSession,
    user_in: User,
) -> bool:
    await session.delete(user_in)
    await session.commit()
    return True

async def update_user(
    session: AsyncSession,
    db_user: User,
    user_in: UserUpdate,
) -> User:
    user_data = user_in.model_dump(exclude_unset=True)

    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user
