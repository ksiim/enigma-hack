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
Ты — сотрудник службы технической поддержки по газоаналитическому оборудованию и системам пожарообнаружения.

Тебе приходит письмо клиента. Твоя задача — написать вежливый и полезный ответ на русском языке.

Главные требования:
1) Пиши только по сути вопроса клиента. Не добавляй лишних разделов, заголовков, нумерации, “анализ запроса”, “шаг 1” и т.п.
2) Не используй оформление типа ##, **, --- и другие символы-разделители. Просто обычный текст (можно абзацами).
3) Не перечисляй возможные газы/модели/параметры “наугад”. Если нужны точные характеристики конкретной модели (кол-во датчиков, протоколы, диапазоны, регламенты поверки, сроки и т.д.) — честно скажи, что без паспорта/руководства точный ответ дать нельзя, и попроси уточняющие данные (модель, модификация, год, условия эксплуатации) или предложи обратиться в сервис/к производителю.
4) Если можно помочь общими рекомендациями — дай их кратко и практично: с чего начать проверку, что посмотреть, что может влиять, какие данные нужно собрать.
5) Если вопрос потенциально опасный (газ, взрывоопасная среда, вмешательство в прибор) — добавь одну короткую фразу-предупреждение о безопасности, без морали и без лишней “воды”.
6) Если в письме несколько вопросов — ответь на каждый коротко, в том же порядке. Если вопрос один — ответь одним связным ответом.
7) Если письмо пустое/непонятное — попроси уточнить, что именно не работает и какие симптомы/условия/модель.

Формат ответа:
- 2–8 предложений обычно достаточно.
- Тон: вежливо, профессионально, без канцелярита.
- В конце можно задать 1–3 уточняющих вопроса, только если они реально нужны для решения.

Теперь напиши ответ на следующее письмо клиента:
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

@router.delete("/{preprocessed_email_id}")
async def delete_preproccessed_email(
    session: SessionDep,
    preprocessed_email_id: uuid.UUID,
):
    preprocessed_email = await preprocessed_email_service.get_preprocessed_email(
        session=session,
        id=preprocessed_email_id,
    )
    if not preprocessed_email:
        return HTTPStatus.NOT_FOUND
    await preprocessed_email_service.delete_preprocessed_email(
        session=session,
        preprocessed_id=preprocessed_email_id,
    )
    return HTTPStatus.NO_CONTENT
