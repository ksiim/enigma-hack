from io import BytesIO, StringIO
from typing import Any, Sequence
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.settings import get_project_settings
from src.app.db.models.preprocessed_email import PreprocessedEmail, PreprocessedEmailCreate, PreprocessedEmailPublic, PreprocessedEmailsPublic
from src.app.crud import preprocessed_email as preprocessed_email_crud

import pandas as pd

from src.app.utils.emails import send_email

project_settings = get_project_settings()

rename_map = {
    "id": "ID",
    "date": "Дата",
    "fio": "ФИО",
    "object": "Объект",
    "object_number": "Номер объекта",
    "object_type": "Тип объекта",
    "phone_number": "Телефон",
    "email": "Email",
    "emotional_color": "Эмоциональный окрас",
    "question": "Вопрос",
    "short_question": "Короткий вопрос",
}

async def get_preprocessed_email(
    session: AsyncSession,
    **filters: Any,
) -> PreprocessedEmailPublic | None:
    if not (email := await preprocessed_email_crud.get_preprocessed_email(session, **filters)):
        return None
    return PreprocessedEmailPublic.model_validate(email)

async def get_preprocessed_emails(
    session: AsyncSession,
    skip: int = 0,
    limit: int = project_settings.DEFAULT_QUERY_LIMIT,
) -> PreprocessedEmailsPublic:
    emails = await preprocessed_email_crud.get_preprocessed_emails(session, skip, limit)
    return PreprocessedEmailsPublic(
        data=[PreprocessedEmailPublic.model_validate(email) for email in emails],
        count=len(emails),
    )

async def create_preprocessed_email(
    session: AsyncSession,
    preprocessed_email_create: PreprocessedEmailCreate,
) -> PreprocessedEmailPublic:
    email = await preprocessed_email_crud.create_preprocessed_email(
        session,
        preprocessed_email_create,
    )
    return PreprocessedEmailPublic.model_validate(email)

async def get_preprocessed_emails_csv_stream(
    session: AsyncSession,
    skip: int = 0,
    limit: int = project_settings.DEFAULT_QUERY_LIMIT,
) -> StringIO:
    if not (emails := await preprocessed_email_crud.get_preprocessed_emails(session, skip, limit)):
        output = BytesIO()
        output.write(b"No data")
        output.seek(0)
        return output
    df = _prepare_dataframe(emails)
    stream = StringIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")
    stream.seek(0)
    return stream

def _prepare_dataframe(emails: Sequence[PreprocessedEmail]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            data.model_dump() for data in emails
        ]
    ).rename(
        columns=rename_map,
    )

async def get_preprocessed_emails_xlsx_stream(
    session: AsyncSession,
    skip: int = 0,
    limit: int = project_settings.DEFAULT_QUERY_LIMIT,
) -> BytesIO:
    if not (emails := await preprocessed_email_crud.get_preprocessed_emails(session, skip, limit)):
        output = BytesIO()
        output.write(b"No data")
        output.seek(0)
        return output
    df = _prepare_dataframe(emails)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(
            writer,
            index=False,
            sheet_name="Emails",
        )
    output.seek(0)
    return output

async def send_email_to_user(
    email: str,
    subject: str,
    body: str,
):
    return await send_email(
        email_to=email,
        subject=subject,
        html_content=body,
    )