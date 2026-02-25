from fastapi import APIRouter, Depends, HTTPException

from src.app.api.dependencies.common import SessionDep
from src.app.api.dependencies.pagination import PaginationDep
from src.app.api.dependencies.users import (
    CurrentUser,
    UserOr404,
    verify_user_ownership,
)
from src.app.db.models.user import (
    UserPublic,
    UsersPublic,
    UserUpdate,
)
from src.app.db.schemas import Message
from src.app.service import user as user_service

router = APIRouter()


@router.get(
    "/",
    response_model=UsersPublic,
)
async def read_users(
    session: SessionDep,
    pagination: PaginationDep,
) -> UsersPublic:
    users = await user_service.get_users(
        session=session,
        skip=pagination.skip,
        limit=pagination.limit,
    )
    return users


@router.get("/me/profile", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> UserPublic:
    """
    Retrieve information about the current authenticated user.
    """
    return UserPublic.model_validate(current_user)


@router.put("/me/profile", response_model=UserPublic)
async def update_user_me(
    session: SessionDep,
    user_in: UserUpdate,
    current_user: CurrentUser,
) -> UserPublic:
    """
    Update the current authenticated user's information.
    """

    user = await user_service.update_user(
        session=session,
        db_user=current_user,
        user_in=user_in,
    )
    return user


@router.delete("/me", response_model=Message)
async def delete_user_me(
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """`
    Delete the current authenticated user.
    """
    if await user_service.delete_user(
        session=session,
        user_in=current_user,
    ):
        return Message(message="User deleted successfully")
    raise HTTPException(
        status_code=500,
        detail="Failed to delete user",
    )

@router.get(
    "/{user_id}",
    response_model=UserPublic,
)
async def read_user_by_id(
    user: UserOr404,
) -> UserPublic:
    """
    Retrieve a user by their ID.
    """
    return UserPublic.model_validate(user)


@router.put(
    "/{user_id}",
    dependencies=[Depends(verify_user_ownership)],
    response_model=UserPublic,
)
async def update_user(
    session: SessionDep,
    user_in: UserUpdate,
    db_user: UserOr404,
) -> UserPublic:
    """
    Update a user's information.
    """
    user = await user_service.update_user(
        session=session,
        db_user=db_user,
        user_in=user_in,
    )
    return user

@router.delete(
    "/{user_id}",
    # dependencies=[Depends(verify_user_ownership)],
    response_model=Message,
)
async def delete_user(
    session: SessionDep,
    user_in: UserOr404,
) -> Message:
    """
    Delete a user by their ID.
    """
    if await user_service.delete_user(
        session=session,
        user_in=user_in,
    ):
        return Message(message="User deleted successfully")
    raise HTTPException(
        status_code=500,
        detail="Failed to delete user",
    )
