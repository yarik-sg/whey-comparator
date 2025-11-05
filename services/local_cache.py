"""Simple JSON-backed cache to avoid repeated external requests."""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

BASE_DIR = Path(__file__).resolve().parents[1]
CACHE_PATH = BASE_DIR / "data" / "local_cache.json"


def _ensure_parent(path: Path) -> None:
    if not path.parent.exists():
        path.parent.mkdir(parents=True, exist_ok=True)


class LocalCache:
    """Very small helper used to persist API responses locally."""

    def __init__(self, path: Path, *, default_ttl: int = 3600) -> None:
        self.path = path
        self.default_ttl = max(int(default_ttl), 0)
        self._lock = Lock()
        self._data: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            self._data = {}
            return

        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            self._data = {}
            return

        now = datetime.now(timezone.utc)
        data: Dict[str, Dict[str, Any]] = {}
        for key, payload in raw.items():
            if not isinstance(payload, dict):
                continue
            expires_at = payload.get("expires_at")
            value = payload.get("value")
            if expires_at is None:
                data[key] = {"value": value, "expires_at": None}
                continue
            try:
                expiry = datetime.fromisoformat(expires_at)
            except (TypeError, ValueError):
                continue
            if expiry <= now:
                continue
            data[key] = {"value": value, "expires_at": expiry}
        self._data = data

    def _serialize(self) -> Dict[str, Dict[str, Any]]:
        serializable: Dict[str, Dict[str, Any]] = {}
        for key, payload in self._data.items():
            if not isinstance(payload, dict):
                continue
            expires_at = payload.get("expires_at")
            value = payload.get("value")
            if isinstance(expires_at, datetime):
                expires_at = expires_at.isoformat()
            serializable[key] = {"value": value, "expires_at": expires_at}
        return serializable

    def _persist(self) -> None:
        _ensure_parent(self.path)
        try:
            self.path.write_text(
                json.dumps(self._serialize(), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except OSError:
            # Ignore IO errors silently; cache misses will simply trigger new fetches.
            pass

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            payload = self._data.get(key)
            if not payload:
                return None
            expires_at = payload.get("expires_at")
            if isinstance(expires_at, datetime) and expires_at <= self._now():
                self._data.pop(key, None)
                self._persist()
                return None
            return payload.get("value")

    def set(self, key: str, value: Any, *, ttl: Optional[int] = None) -> None:
        ttl_seconds = self.default_ttl if ttl is None else max(int(ttl), 0)
        expires_at: Optional[datetime]
        if ttl_seconds <= 0:
            expires_at = None
        else:
            expires_at = self._now() + timedelta(seconds=ttl_seconds)

        with self._lock:
            self._data[key] = {"value": value, "expires_at": expires_at}
            self._persist()

    def get_or_set(self, key: str, factory, *, ttl: Optional[int] = None) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = factory()
        self.set(key, value, ttl=ttl)
        return value


local_cache = LocalCache(CACHE_PATH, default_ttl=60 * 60)

__all__ = ["LocalCache", "local_cache"]
