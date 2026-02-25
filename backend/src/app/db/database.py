from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base

from src.app.core.settings import get_postgres_settings

settings = get_postgres_settings()

async_engine = create_async_engine(settings.async_db)
Session = async_sessionmaker(async_engine)

Base = declarative_base()
