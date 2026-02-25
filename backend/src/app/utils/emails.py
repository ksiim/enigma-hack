from dataclasses import dataclass

import emails

from src.app.core.settings import get_project_settings, get_smtp_settings

smtp_settings = get_smtp_settings()
project_settings = get_project_settings()


@dataclass
class EmailData:
    html_content: str
    subject: str


async def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
):
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(smtp_settings.EMAILS_FROM_NAME, smtp_settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": smtp_settings.HOST, "port": smtp_settings.PORT}
    smtp_options["user"] = smtp_settings.USER
    smtp_options["password"] = smtp_settings.PASSWORD
    smtp_options["tls"] = smtp_settings.TLS
    response = message.send(to=email_to, smtp=smtp_options)
    return response
