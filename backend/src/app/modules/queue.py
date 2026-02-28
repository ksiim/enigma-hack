from functools import lru_cache
import os
import redis.asyncio as redis
import json

from src.app.core.settings import RedisSettings, get_redis_settings

class EmailQueue:
    def __init__(self, redis_settings: RedisSettings, queue_name: str):
        self._redis_client = redis.Redis(
            host=redis_settings.HOST,
            port=redis_settings.PORT,
            db=redis_settings.DB,
            encoding="utf-8",
            decode_responses=True
        )
        self._queue_name = queue_name
    
    @property
    async def is_empty(self) -> bool:
        length = await self._redis_client.llen(self._queue_name)
        return length == 0

    async def enqueue_email(self, email_data: dict):
        await self._redis_client.rpush(self._queue_name, json.dumps(email_data))

    async def dequeue_email(self):
        data = await self._redis_client.lpop(self._queue_name)
        if data:
            return json.loads(data)
        return None

    async def set(self, key: str, value):
        await self._redis_client.set(key, value)

    async def get(self, key: str):
        return await self._redis_client.get(key)

@lru_cache(maxsize=1)
def get_email_queue() -> EmailQueue:
    redis_settings = get_redis_settings()
    return EmailQueue(redis_settings, queue_name="email_queue")
