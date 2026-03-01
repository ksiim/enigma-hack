from typing import Any
from sqlalchemy import Sequence, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.settings import get_project_settings
from src.app.db.models import PreprocessedEmail
from src.app.db.models.preprocessed_email import PreprocessedEmailCreate

project_settings = get_project_settings()

async def get_preprocessed_email(
    session: AsyncSession,
    **filters: Any,
) -> PreprocessedEmail | None:
    statement = select(PreprocessedEmail).filter_by(**filters)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    return user

async def create_preprocessed_email(
    session: AsyncSession,
    preprocessed_email_create: PreprocessedEmailCreate,
) -> PreprocessedEmail:
    preprocessed_email = PreprocessedEmail.model_validate(
        preprocessed_email_create,
    )
    session.add(preprocessed_email)
    await session.commit()
    await session.refresh(preprocessed_email)
    return preprocessed_email

async def get_preprocessed_emails(
    session: AsyncSession,
    skip: int = 0,
    limit: int = project_settings.DEFAULT_QUERY_LIMIT,
) -> Sequence[PreprocessedEmail]:
    statement = select(PreprocessedEmail).offset(skip).limit(limit)
    preprocessed_emails = (await session.execute(
        statement,
    )).scalars().all()
    return preprocessed_emails

async def delete_preprocessed_email(
    session: AsyncSession,
    preprocessed_id: int,
) -> None:
    statement = select(PreprocessedEmail).filter_by(id=preprocessed_id)
    result = await session.execute(statement)
    preprocessed_email = result.scalar_one_or_none()
    if preprocessed_email:
        await session.delete(preprocessed_email)
        await session.commit()

async def get_preprocessed_emails_count(
    session: AsyncSession,
) -> int:
    statement = select(func.count()).select_from(PreprocessedEmail)
    result = await session.execute(statement)
    count = result.scalar_one()
    return count