from http import HTTPStatus
import uuid
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.app.api.dependencies.pagination import PaginationDep
from src.app.api.dependencies.users import SessionDep
from src.app.modules.gigachat import get_gigachat
from src.app.service import preprocessed_email as preprocessed_email_service
from src.app.db.models.preprocessed_email import PreprocessedEmailCreate

router = APIRouter()


@router.post("/")
async def create_preproccessed_email(
    session: SessionDep,
    preprocessed_email_create: PreprocessedEmailCreate,
):
    return await preprocessed_email_service.create_preprocessed_email(
        session,
        preprocessed_email_create,
    )
    

@router.get("/")
async def get_preproccessed_emails(
    session: SessionDep,
    pagination: PaginationDep,
):
    return await preprocessed_email_service.get_preprocessed_emails(
        session=session,
        skip=pagination.skip,
        limit=pagination.limit,
    )

@router.get("/csv", response_class=StreamingResponse)
async def get_preprocessed_emails_csv(
    session: SessionDep,
    skip: int = 0,
    limit: int = 1000,
):
    stream = await preprocessed_email_service.get_preprocessed_emails_csv_stream(
        session=session,
        skip=skip,
        limit=limit,
    )
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="emails.csv"'
        }
    )


@router.get("/xlsx", response_class=StreamingResponse)
async def get_preprocessed_emails_xlsx(
    session: SessionDep,
    skip: int = 0,
    limit: int = 1000,
):
    stream = await preprocessed_email_service.get_preprocessed_emails_xlsx_stream(
        session=session,
        skip=skip,
        limit=limit,
    )
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="emails.xlsx"'
        }
    )

@router.get("/help-answer")
async def get_preproccessed_emails_help_answer(
    preprocessed_email_id: uuid.UUID,
    session: SessionDep,
):
    preprocessed_email = await preprocessed_email_service.get_preprocessed_email(
        session=session,
        id=preprocessed_email_id,
    )
    gigachat = get_gigachat()
    return await gigachat.chat(
        prompt="""
Ты — опытный сотрудник службы технической поддержки компании, специализирующейся на газоаналитическом оборудовании и системах пожарообнаружения. Твоя задача — вежливо и понятно отвечать на вопросы пользователей.

У тебя нет доступа к технической документации и инструкциям к конкретным моделям. Поэтому при ответе соблюдай следующие правила:

1.  Опирайся на общие знания: Используй базовые знания физики, электроники и принципов работы газоанализаторов и пожарных извещателей.
2.  Шаблонность: Если вопрос типовой (например, про калибровку, настройку чувствительности или причины срабатывания ложной тревоги), предложи общий алгоритм действий. Начинай с самых простых решений (проверка питания, загрязнение датчика, внешние факторы).
3.  Честность и осторожность: Если вопрос касается конкретных цифр, технических параметров конкретной модели или сложного ремонта, который требует вскрытия прибора, не выдумывай ответ. Напиши: «Для точного ответа на этот вопрос мне нужно обратиться к технической документации. Рекомендую проверить руководство пользователя или обратиться к инженеру сервисной службы.»
4.  Структура ответа:
    *   Краткий анализ проблемы (своими словами).
    *   Пошаговая инструкция или объяснение (общими фразами).
    *   Предупреждение о технике безопасности (где это уместно).
    *   Призыв к действию или предложение помощи.
5.  Язык: Отвечай на том же языке, на котором написан вопрос пользователя.
""" + preprocessed_email.question,
    )

@router.post("/send-answer")
async def send_answer(
    session: SessionDep,
    preprocessed_email_id: uuid.UUID,
    answer_text: str,
):
    if not (
        preprocessed_email := await preprocessed_email_service.get_preprocessed_email(
            session=session,
            id=preprocessed_email_id,
        )
    ):
        return HTTPStatus.NOT_FOUND
    return await preprocessed_email_service.send_email_to_user(
        email=preprocessed_email.email,
        subject="Ответ на вопрос",
        body=answer_text,
    )
    # return HTTPStatus.NO_CONTENT
