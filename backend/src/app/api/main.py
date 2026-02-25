from fastapi import APIRouter

from src.app.api.routes import (
    healthcheck,
    login,
    users,
    preprocessed_email,
)

api_router = APIRouter()


api_router.include_router(
    users.router, tags=["users"], prefix="/users",
)
api_router.include_router(
    login.router, tags=["login"], prefix="/login",
)
api_router.include_router(
    preprocessed_email.router, tags=["preprocessed_email"], prefix="/preprocessed_email",
)
api_router.include_router(
    healthcheck.router, tags=["healthcheck"],
)
