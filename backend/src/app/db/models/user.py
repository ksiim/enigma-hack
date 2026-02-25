import datetime
import uuid
from typing import TYPE_CHECKING

from pydantic import EmailStr, field_serializer
from sqlmodel import Field, Relationship, SQLModel

from src.app.const import Variants


class Role(Variants):
    USER = "user"
    EMPLOYEE = "employee"
    ADMIN = "admin"

class UserBase(SQLModel):
    name: str = Field(max_length=255, nullable=False)
    surname: str = Field(max_length=255, nullable=False)
    patronymic: str | None = Field(max_length=255, nullable=True)
    role: Role = Field(default=Role.USER)
    email: EmailStr = Field(max_length=255, unique=True, nullable=False, index=True)
    date_of_birth: datetime.date


class User(UserBase, table=True):
    __tablename__ = "users" # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)


class UserCreate(UserBase):
    password: str
    
    @field_serializer("email")
    def serialize_email(self, email: EmailStr) -> str:
        return email.lower()


class UserUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    surname: str | None = Field(default=None, max_length=255)
    patronymic: str | None = Field(default=None, max_length=255)


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime.datetime


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
