import datetime
import email
import uuid

from pydantic import EmailStr, field_serializer
from sqlmodel import Field, SQLModel


class PreprocessedEmailBase(SQLModel):
    date: datetime.date
    fio: str | None
    object: str | None
    object_number: str | None
    object_type: str | None
    phone_number: str | None
    email: EmailStr
    emotional_color: str
    question: str
    short_question: str


class PreprocessedEmail(PreprocessedEmailBase, table=True):
    __tablename__ = "preprocessed_emails" # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class PreprocessedEmailCreate(PreprocessedEmailBase):
    @field_serializer("email")
    def serialize_email(self, email: EmailStr) -> str:
        return email.lower()


class PreprocessedEmailPublic(PreprocessedEmailBase):
    id: uuid.UUID


class PreprocessedEmailsPublic(SQLModel):
    data: list[PreprocessedEmailPublic]
    count: int
