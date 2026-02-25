from typing import NoReturn
from fastapi import APIRouter

from src.app.api.dependencies.pagination import PaginationDep

router = APIRouter(tags=["email"])

@router.get("/")
async def get_preproccessed_emails(
    pagination: PaginationDep,
):
    raise NotImplementedError("Email login is not implemented yet")

@router.get("/csv")
async def get_preproccessed_emails_csv(
    pagination: PaginationDep,
):
    raise NotImplementedError("Email login is not implemented yet")

@router.get("/xlsx")
async def get_preproccessed_emails_xlsx(
    pagination: PaginationDep,
):
    raise NotImplementedError("Email login is not implemented yet")

@router.get("/help-answer")
async def get_preproccessed_emails_help_answer():
    raise NotImplementedError("Email login is not implemented yet")

@router.post("/send-answer")
async def send_answer():
    raise NotImplementedError("Email login is not implemented yet")
