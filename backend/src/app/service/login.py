from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.crud import login as login_crud
from src.app.crud import user as user_crud
from src.app.db.models.user import UserCreate

