import datetime
import email
import uuid

from pydantic import EmailStr, field_serializer
from sqlmodel import Field, SQLModel


class PreprocessedEmailBase(SQLModel):
    date: datetime.date
    fio: str
    object: str
    phone_number: str
    email: EmailStr
    object_number: str
    object_type: str
    emotional_color: str
    question: str


class PreprocessedEmail(PreprocessedEmailBase, table=True):
    __tablename__ = "preprocessed_emails" # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class UserCreate(PreprocessedEmailBase):
    @field_serializer("email")
    def serialize_email(self, email: EmailStr) -> str:
        return email.lower()


class PreprocessedEmailPublic(PreprocessedEmailBase):
    id: uuid.UUID


class PreprocessedEmailsPublic(SQLModel):
    data: list[PreprocessedEmailPublic]
    count: int
