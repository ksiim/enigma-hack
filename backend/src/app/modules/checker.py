import email
from email.header import decode_header
from src.app.modules.queue import get_email_queue
from src.app.modules.dto import EmailData
from aioimaplib import aioimaplib
from src.app.core.settings import get_redis_settings, get_imap_settings

imap_settings = get_imap_settings()
redis_settings = get_redis_settings()


async def check_new_emails():
    redis_client = get_email_queue()
    if not await redis_client.is_empty:
        return

    imap_client = aioimaplib.IMAP4_SSL(imap_settings.HOST, imap_settings.PORT)
    await imap_client.wait_hello_from_server()
    await imap_client.login(imap_settings.USER, imap_settings.PASSWORD)
    await imap_client.select("INBOX")

    resp = await imap_client.search("UNSEEN", charset="UTF-8")
    
    if not resp.lines or resp.lines[0].upper().startswith(b"OK") and not any(b" " in line for line in resp.lines):
        print("Нет новых (непрочитанных) писем")
        await imap_client.logout()
        return

    uid_line = resp.lines[0] if resp.lines else b""
    if isinstance(uid_line, bytes):
        uid_str_list = uid_line.decode().split()
    else:
        uid_str_list = []
    if not uid_str_list:
        await imap_client.logout()
        return
    print(uid_str_list)
    uids = [int(u) for u in uid_str_list if u.isdigit()]
    uids.sort(reverse=True)
    recent_uids = uids[:5]
    print(recent_uids)
    for uid_int in recent_uids:
        resp = await imap_client.uid("FETCH", str(uid_int), "(RFC822)")
        if len(resp.lines) < 2:
            continue
        raw_email = b""
        for line in resp.lines:
            if line.startswith(b"*") or b"FETCH" in line or line.startswith(b")"):
                continue
            raw_email += line + b"\r\n"

        if not raw_email.strip():
            continue
        try:
            msg = email.message_from_bytes(raw_email)
        except Exception as e:
            print(f"Ошибка парсинга письма UID {uid_int}: {e}")
            continue
        subject_raw = decode_header(msg["Subject"] or "(без темы)")[0]
        subject = subject_raw[0]
        if isinstance(subject, bytes):
            charset = subject_raw[1] or "utf-8"
            try:
                subject = subject.decode(charset, errors="replace")
            except:
                subject = "(ошибка декодирования темы)"
        new_var = get_email_body(msg)
        email_data = EmailData(
            uid=str(uid_int),
            subject=subject,
            from_=msg.get("From", "").split("<")[1].strip().replace('>', ''),
            date=msg.get("Date", ""),
            body=new_var,
        )
        await redis_client.enqueue_email(email_data.__dict__)
    await imap_client.logout()

def get_email_body(msg: email.message.Message) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition"))
            if ctype == "text/plain" and "attachment" not in disp:
                text = part.get_payload(decode=True).decode("utf-8", errors="ignore")
    else:
        text = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
    if text.endswith("Success\r\n"):
        text = text.rsplit("Success\r\n", 1)[0].strip()
    return text or ""
