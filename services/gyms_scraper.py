"""Utilities for scraping gym listings from partner websites."""
from __future__ import annotations

import json
import os
import re
from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import requests
from bs4 import BeautifulSoup

from .local_cache import local_cache


BASE_DIR = Path(__file__).resolve().parents[1]
FALLBACK_GYMS_PATH = BASE_DIR / "data" / "gyms_fallback.json"


class SourceNotFoundError(Exception):
    """Raised when a remote directory returns a 404 status code."""


CACHE_TTL_SECONDS = 6 * 60 * 60
DEFAULT_PARTNER_BRANDS: tuple[str, ...] = ("Basic-Fit", "Fitness Park", "Neoness", "On Air")


def _brand_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _gym_identifier(entry: Dict[str, Any]) -> Optional[str]:
    raw_id = entry.get("id")
    if raw_id:
        slug = re.sub(r"[^a-z0-9]+", "-", str(raw_id).lower()).strip("-")
        if slug:
            return slug
    name = entry.get("name")
    if isinstance(name, str) and name.strip():
        return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or None
    return None


@lru_cache(maxsize=1)
def _load_fallback_dataset() -> Dict[str, List[Dict[str, Any]]]:
    if not FALLBACK_GYMS_PATH.exists():
        return {}

    try:
        with FALLBACK_GYMS_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return {}

    dataset: Dict[str, List[Dict[str, Any]]] = {}
    for key, value in payload.items():
        if isinstance(value, list):
            dataset[key] = [deepcopy(item) for item in value if isinstance(item, dict)]
    return dataset


def _fallback_gyms(brand: str) -> List[Dict[str, Any]]:
    dataset = _load_fallback_dataset()
    slug = _brand_slug(brand)
    options = dataset.get(slug) or dataset.get(brand.lower()) or []
    return [deepcopy(item) for item in options]


def _normalize_price(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_amenities(raw: Any) -> List[str]:
    if isinstance(raw, list):
        return [str(item) for item in raw if isinstance(item, str) and item.strip()]
    if isinstance(raw, str) and raw.strip():
        return [raw.strip()]
    return []


def _normalize_gym_payload(entry: Dict[str, Any], brand: str) -> Dict[str, Any]:
    normalized = {**entry}
    normalized["brand"] = normalized.get("brand") or brand
    website = normalized.get("website") or normalized.get("link")
    if isinstance(website, str):
        normalized["website"] = website
    normalized.setdefault("currency", "EUR")
    normalized["amenities"] = _normalize_amenities(normalized.get("amenities"))
    price = _normalize_price(normalized.get("monthly_price"))
    if price is None:
        normalized.pop("monthly_price", None)
    else:
        normalized["monthly_price"] = price
    return normalized


def _merge_with_fallback(
    brand: str,
    remote_entries: List[Dict[str, Any]],
    fallback_entries: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    fallback_lookup: Dict[str, Dict[str, Any]] = {}
    for item in fallback_entries:
        identifier = _gym_identifier(item)
        if identifier:
            fallback_lookup[identifier] = deepcopy(item)

    merged: List[Dict[str, Any]] = []
    seen: set[str] = set()

    for entry in remote_entries:
        identifier = _gym_identifier(entry)
        combined: Dict[str, Any] = {}
        if identifier and identifier in fallback_lookup:
            combined.update(fallback_lookup[identifier])
        combined.update(entry)
        normalized = _normalize_gym_payload(combined, brand)
        if identifier:
            seen.add(identifier)
        merged.append(normalized)

    for identifier, fallback_item in fallback_lookup.items():
        if identifier in seen:
            continue
        merged.append(_normalize_gym_payload(fallback_item, brand))

    return merged


def _store_in_cache(brand: str, gyms: List[Dict[str, Any]]) -> None:
    cache_key = f"gyms:{_brand_slug(brand)}"
    local_cache.set(cache_key, gyms, ttl=CACHE_TTL_SECONDS)


def _fetch_cached(brand: str) -> Optional[List[Dict[str, Any]]]:
    cache_key = f"gyms:{_brand_slug(brand)}"
    cached = local_cache.get(cache_key)
    if isinstance(cached, list):
        return [deepcopy(item) for item in cached if isinstance(item, dict)]
    return None


def _fetch_basicfit_remote() -> List[Dict[str, Any]]:
    url = "https://www.basic-fit.com/fr-fr/salles-de-sport"
    response = requests.get(url, timeout=10)
    if response.status_code == 404:
        raise SourceNotFoundError("Basic-Fit directory returned 404")
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    gyms: List[Dict[str, Any]] = []

    for link in soup.select("a.card-location"):
        href = link.get("href")
        name = link.get_text(strip=True)

        if not href or not name:
            continue

        normalized_href = href.strip()
        identifier = normalized_href.rstrip("/").split("/")[-1]
        gyms.append(
            {
                "id": identifier or name,
                "name": name,
                "brand": "Basic-Fit",
                "website": f"https://www.basic-fit.com{normalized_href}",
            }
        )

    return gyms


def _fetch_json_directory(url: str, brand: str) -> List[Dict[str, Any]]:
    response = requests.get(url, timeout=10)
    if response.status_code == 404:
        raise SourceNotFoundError(f"{brand} directory returned 404")
    response.raise_for_status()

    try:
        payload = response.json()
    except ValueError as exc:
        raise SourceNotFoundError(f"{brand} directory returned invalid JSON") from exc

    if isinstance(payload, dict):
        candidates: Any = None
        for key in ("gyms", "clubs", "items", "data", "results"):
            value = payload.get(key)
            if isinstance(value, list):
                candidates = value
                break
        if candidates is None and isinstance(payload.get("entries"), list):
            candidates = payload["entries"]
    elif isinstance(payload, list):
        candidates = payload
    else:
        candidates = []

    gyms: List[Dict[str, Any]] = []
    for item in candidates or []:
        if not isinstance(item, dict):
            continue
        gyms.append(
            {
                "id": item.get("id") or item.get("slug") or item.get("code"),
                "name": item.get("name") or item.get("title"),
                "brand": brand,
                "address": item.get("address") or item.get("street"),
                "postal_code": item.get("postal_code")
                or item.get("zip")
                or item.get("zipcode"),
                "city": item.get("city"),
                "latitude": item.get("latitude"),
                "longitude": item.get("longitude"),
                "monthly_price": item.get("monthly_price")
                or item.get("price")
                or item.get("price_from"),
                "currency": item.get("currency")
                or item.get("currency_code")
                or "EUR",
                "amenities": item.get("amenities") or item.get("services") or [],
                "website": item.get("website") or item.get("url") or item.get("link"),
            }
        )

    return [gym for gym in gyms if gym.get("name")]


def _load_brand_from_json(brand: str, env_var: str) -> List[Dict[str, Any]]:
    cached = _fetch_cached(brand)
    if cached is not None:
        return cached

    fallback_entries = _fallback_gyms(brand)
    url = os.getenv(env_var)
    gyms: List[Dict[str, Any]] = []

    if url:
        try:
            remote_entries = _fetch_json_directory(url, brand)
            gyms = _merge_with_fallback(brand, remote_entries, fallback_entries)
        except SourceNotFoundError:
            gyms = fallback_entries
        except requests.RequestException:
            gyms = fallback_entries
    else:
        gyms = fallback_entries

    normalized = [_normalize_gym_payload(entry, brand) for entry in gyms]
    _store_in_cache(brand, normalized)
    return normalized


def get_basicfit_gyms() -> List[Dict[str, Any]]:
    """Return a list of Basic-Fit gyms scraped from the public directory."""

    cached = _fetch_cached("Basic-Fit")
    if cached is not None:
        return cached

    fallback_entries = _fallback_gyms("Basic-Fit")

    try:
        remote_entries = _fetch_basicfit_remote()
        gyms = _merge_with_fallback("Basic-Fit", remote_entries, fallback_entries)
    except SourceNotFoundError:
        gyms = fallback_entries
    except requests.RequestException:
        gyms = fallback_entries

    normalized = [_normalize_gym_payload(entry, "Basic-Fit") for entry in gyms]
    _store_in_cache("Basic-Fit", normalized)
    return normalized


def get_partner_gyms(
    brands: Optional[Iterable[str]] = None,
    *,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    requested = list(brands) if brands else list(DEFAULT_PARTNER_BRANDS)

    collected: Dict[str, Dict[str, Any]] = {}
    for brand in requested:
        slug = _brand_slug(brand)
        if slug == "basicfit":
            gyms = get_basicfit_gyms()
        elif slug == "fitnesspark":
            gyms = _load_brand_from_json("Fitness Park", "FITNESS_PARK_DIRECTORY_URL")
        elif slug == "neoness":
            gyms = _load_brand_from_json("Neoness", "NEONESS_DIRECTORY_URL")
        elif slug == "onair":
            gyms = _load_brand_from_json("On Air", "ONAIR_DIRECTORY_URL")
        else:
            gyms = _fallback_gyms(brand)
            gyms = [_normalize_gym_payload(entry, brand) for entry in gyms]

        for gym in gyms:
            identifier = _gym_identifier(gym) or _brand_slug(f"{brand}-{gym.get('name','gym')}")
            existing = collected.get(identifier)
            if existing:
                merged = {**existing, **gym}
                merged = _normalize_gym_payload(merged, gym.get("brand") or brand)
                collected[identifier] = merged
            else:
                collected[identifier] = _normalize_gym_payload(gym, gym.get("brand") or brand)

    results = list(collected.values())
    results.sort(key=lambda item: (item.get("brand") or "", item.get("city") or "", item.get("name") or ""))

    if limit is not None:
        try:
            limit_value = max(int(limit), 0)
        except (TypeError, ValueError):
            limit_value = 0
        if limit_value:
            return results[:limit_value]
        return []

    return results

