import asyncpg

from src.app.core.settings import get_postgres_settings

postgres_settings = get_postgres_settings()

async def check_postgres():
    try:
        conn = await asyncpg.connect(
            user=postgres_settings.USER,
            password=postgres_settings.PASSWORD,
            database=postgres_settings.DATABASE,
            host=postgres_settings.SERVER,
            port=postgres_settings.PORT,
        )
        await conn.close()
        return True
    except Exception:
        return False
