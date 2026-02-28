from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.app.modules.checker import check_new_emails

scheduler = AsyncIOScheduler()

# Запуск каждые 5 минут
scheduler.add_job(check_new_emails, "interval", minutes=5)

# Для запуска в приложении:
# scheduler.start()
