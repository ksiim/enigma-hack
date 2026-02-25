from functools import cached_property, lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PostgresSettings(BaseSettings):
    SERVER: str
    USER: str
    PASSWORD: str
    DATABASE: str
    PORT: int

    @cached_property
    def async_db(self) -> str:
        return f'postgresql+asyncpg://{self.USER}:{self.PASSWORD}@{self.SERVER}:{self.PORT}/{self.DATABASE}'

    @cached_property
    def sync_db(self) -> str:
        return f'postgresql://{self.USER}:{self.PASSWORD}@{self.SERVER}:{self.PORT}/{self.DATABASE}'

    model_config = SettingsConfigDict(
        env_prefix="POSTGRES_",
    )


class ProjectSettings(BaseSettings):
    NAME: str
    FRONTEND_HOST: str
    API_V1_STR: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DEFAULT_QUERY_LIMIT: int = Field(default=100)
    SUPERUSER_EMAIL: str | None = None
    SUPERUSER_PASSWORD: str | None = None

    model_config = SettingsConfigDict(
        env_prefix="PROJECT_",
    )


class SMTPSettings(BaseSettings):
    HOST: str = Field(default="smtp.gmail.com")
    USER: str
    PASSWORD: str
    EMAILS_FROM_EMAIL: str | None = None
    EMAILS_FROM_NAME: str | None = None
    TLS: bool = Field(default=True)
    SSL: bool = Field(default=False)
    PORT: int = Field(default=587)

    model_config = SettingsConfigDict(
        env_prefix="SMTP_",
    )


@lru_cache(maxsize=1)
def get_postgres_settings() -> PostgresSettings:
    return PostgresSettings() # type: ignore


@lru_cache(maxsize=1)
def get_project_settings() -> ProjectSettings:
    return ProjectSettings() # type: ignore


@lru_cache(maxsize=1)
def get_smtp_settings() -> SMTPSettings:
    return SMTPSettings() # type: ignore
