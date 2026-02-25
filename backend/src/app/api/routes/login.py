import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from src.app.db.models.user import UserCreate
import src.app.service.user as user_service
from src.app.api.dependencies.common import SessionDep
from src.app.core.security import create_access_token
from src.app.core.settings import get_project_settings
from src.app.db.schemas import Token

router = APIRouter(tags=["login"])

@router.post("/access-token")
async def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    project_settings = get_project_settings()
    if not (
        user := await user_service.authenticate(
            session=session,
            email=form_data.username,
            password=form_data.password,
        )
    ):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token_expires = datetime.timedelta(minutes=project_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(access_token=create_access_token(str(user.id), access_token_expires))


@router.post("/super")
async def create_super_user(
    session: SessionDep,
) -> Token:
    """
    Create superuser and get an access token for future requests
    """
    project_settings = get_project_settings()
    if not project_settings.SUPERUSER_EMAIL or not project_settings.SUPERUSER_PASSWORD:
        raise HTTPException(status_code=400, detail="Superuser credentials are not set")
    if not (
        user := await user_service.get_user(
            session=session,
            email=project_settings.SUPERUSER_EMAIL,
        )
    ):
        user = await user_service.create_user(
            session=session,
            user_in=UserCreate(
                email=project_settings.SUPERUSER_EMAIL,
                password=project_settings.SUPERUSER_PASSWORD,
                name="Superuser",
                surname="surname",
                patronymic="patronymic",
                date_of_birth=datetime.date(2000, 1, 1),
            )
        )
    access_token_expires = datetime.timedelta(minutes=project_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(access_token=create_access_token(str(user.id), access_token_expires))
