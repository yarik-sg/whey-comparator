from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

from .settings import settings


class Cache:
    def __init__(self, url: str) -> None:
        self._redis = Redis.from_url(url, encoding="utf-8", decode_responses=True)

    async def get_json(self, key: str) -> Any:
        value = await self._redis.get(key)
        if value is None:
            return None
        return json.loads(value)

    async def set_json(self, key: str, value: Any, ttl: int = 3600) -> None:
        await self._redis.set(key, json.dumps(value), ex=ttl)

    async def close(self) -> None:
        await self._redis.aclose()


cache = Cache(settings.redis_url)
