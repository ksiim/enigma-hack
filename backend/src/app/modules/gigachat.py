import asyncio
import time
import uuid
import httpx
from functools import lru_cache
from src.app.core.settings import GigachatSettings, get_gigachat_settings


class Gigachat:
    OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    def __init__(self, settings: GigachatSettings, scope: str = "GIGACHAT_API_PERS"):
        self.auth_key = settings.AUTH_KEY
        self.scope = scope
        self._model = "GigaChat-2"

        self._access_token: str | None = None
        self._expires_at: float = 0
        self._lock = asyncio.Lock()

        self._client = httpx.AsyncClient(timeout=30, verify=False)

    async def chat(self, prompt: str, model: str = "GigaChat", temperature: float = 0) -> str:
        await self._ensure_token()
        response = await self._client.post(
            self.CHAT_URL,
            headers={
                "Authorization": f"Bearer {self._access_token}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def close(self):
        await self._client.aclose()

    async def _ensure_token(self):
        if self._access_token and time.time() < self._expires_at:
            return
        async with self._lock:
            if self._access_token and time.time() < self._expires_at:
                return
            await self._refresh_token()

    async def _refresh_token(self):
        response = await self._client.post(
            self.OAUTH_URL,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": str(uuid.uuid4()),
                "Authorization": f"Basic {self.auth_key}",
            },
            data={
                "scope": self.scope,
            },
        )
        response.raise_for_status()
        token_data = response.json()
        self._access_token = token_data["access_token"]
        expires_ms = token_data.get("expires_at")
        if expires_ms:
            self._expires_at = expires_ms / 1000 - 60
        else:
            self._expires_at = time.time() + 1700


@lru_cache(maxsize=1)
def get_gigachat() -> Gigachat:
    settings = get_gigachat_settings()
    return Gigachat(settings)