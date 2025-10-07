from fastapi import FastAPI, HTTPException, Query
from datetime import datetime, timedelta

from fastapi.middleware.cors import CORSMiddleware
import html
import os, re
import requests
from urllib.parse import urlparse, parse_qs, quote
from functools import lru_cache
from typing import Dict, Any, List, Optional

from fallback_catalogue import (
    get_fallback_price_history,
    get_fallback_product,
    get_fallback_products,
)

app = FastAPI()

# --- CORS (ok pour dev; en prod restreins à ton domaine) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SerpAPI ---
SERPAPI_KEY = os.getenv(
    "SERPAPI_KEY",
    "e1518f7c9ca45f0dac6b04f7ef634d9d35e71956620dcd36587d7df8446c3495"
)
SERPAPI_BASE = "https://serpapi.com/search.json"
SCRAPER_BASE_URL = os.getenv("SCRAPER_BASE_URL", "http://localhost:8001")


def _env_flag(name: str, *, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


FORCE_IMAGE_HTTPS = _env_flag("FORCE_IMAGE_HTTPS", default=False)

# Domaines que l’on préfère (priorisation quand plusieurs vendeurs)
PREFERRED_DOMAINS = [
    "myprotein.fr",
    "prozis.com",
    "decathlon.fr",
    "nutrimuscle.com",
]

PRICE_HISTORY_PERIODS = {
    "7d": timedelta(days=7),
    "1m": timedelta(days=30),
    "3m": timedelta(days=90),
    "6m": timedelta(days=180),
    "1y": timedelta(days=365),
}

# --- Utils ---

def decode_google_redirect(u: Optional[str]) -> Optional[str]:
    if not u:
        return None
    try:
        pu = urlparse(u)
        if pu.netloc.endswith("google.com") and pu.path == "/url":
            q = parse_qs(pu.query).get("q", [""])[0]
            return q or u
        return u
    except Exception:
        return u

def is_http_url(u: Optional[str]) -> bool:
    if not u:
        return False
    try:
        pu = urlparse(u)
        return pu.scheme in ("http", "https")
    except Exception:
        return False


PLACEHOLDER_IMAGE_DOMAINS = {"example.com"}


def _is_serpapi_host(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
    except Exception:
        return False
    return host.endswith("serpapi.com")


def pick_best_image_candidate(candidates: List[Optional[str]]) -> Optional[str]:
    """Pick the most suitable image URL for display."""

    preferred: List[str] = []
    fallback: List[str] = []

    for candidate in candidates:
        normalized = normalize_image_url(candidate)
        if not normalized:
            continue
        if _is_serpapi_host(normalized):
            fallback.append(normalized)
        else:
            preferred.append(normalized)

    if preferred:
        return preferred[0]
    if fallback:
        return fallback[0]
    return None


def normalize_image_url(value: Any) -> Optional[str]:
    """Return a trimmed image URL or ``None`` when empty/invalid."""

    if isinstance(value, str):
        trimmed = value.strip()
        if trimmed:
            if trimmed.startswith("//"):
                return "https:" + trimmed
            if trimmed.startswith("http://"):
                if FORCE_IMAGE_HTTPS:
                    try:
                        parsed = urlparse(trimmed)
                        host = (parsed.hostname or "").lower()
                    except Exception:
                        host = ""

                    if host and not (
                        host == "localhost"
                        or host.startswith("localhost:")
                        or host.startswith("127.")
                        or host.endswith(".local")
                    ):
                        return "https://" + trimmed[len("http://") :]
                return trimmed
            return trimmed
    return None


def _placeholder_host(host: str) -> bool:
    normalized = host.lower()
    return any(
        normalized == domain or normalized.endswith(f".{domain}")
        for domain in PLACEHOLDER_IMAGE_DOMAINS
    )


def looks_like_placeholder_image(value: Optional[str]) -> bool:
    candidate = normalize_image_url(value)
    if not candidate:
        return True
    if candidate.startswith("data:"):
        return False
    if candidate.startswith("//"):
        candidate = f"https:{candidate}"
    try:
        parsed = urlparse(candidate)
    except Exception:
        return False
    host = parsed.netloc
    if not host:
        return False
    return _placeholder_host(host)


def build_placeholder_image(*, name: Optional[str], brand: Optional[str]) -> str:
    brand_label = (brand or "Protéines").strip() or "Protéines"
    name_label = (name or "Comparateur").strip() or "Comparateur"

    primary_text = html.escape(brand_label[:28])
    secondary_text = html.escape(name_label[:48])

    svg = f"""
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' preserveAspectRatio='xMidYMid meet'>
  <defs>
    <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#0f172a'/>
      <stop offset='100%' stop-color='#1f2937'/>
    </linearGradient>
  </defs>
  <rect width='600' height='400' rx='32' fill='url(#g)'/>
  <text x='50%' y='45%' fill='#fbbf24' font-family='"Segoe UI", "Helvetica Neue", sans-serif' font-size='40' font-weight='600' text-anchor='middle'>{primary_text}</text>
  <text x='50%' y='63%' fill='#e2e8f0' font-family='"Segoe UI", "Helvetica Neue", sans-serif' font-size='26' text-anchor='middle'>{secondary_text}</text>
</svg>
"""

    return "data:image/svg+xml," + quote(svg)


def resolve_image_with_placeholder(
    candidates: List[Optional[str]], *, name: Optional[str], brand: Optional[str]
) -> str:
    candidate = pick_best_image_candidate(candidates)
    if candidate and not looks_like_placeholder_image(candidate):
        return candidate
    return build_placeholder_image(name=name, brand=brand)


def isoformat_utc(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat() + "Z"


def sanitize_price_str(price_str: Optional[str]) -> Optional[str]:
    """Nettoie les prix type '19,90\\u00a0\\u20ac' -> '19,90 €'."""
    if not price_str:
        return None
    return (
        price_str
        .replace("\\u00a0", " ")
        .replace("\u00a0", " ")
        .replace("\\u20ac", "€")
        .replace("EUR", "€")
        .replace("Euro", "€")
        .strip()
    )

def price_to_float(price_str: Optional[str]) -> Optional[float]:
    if not price_str:
        return None
    s = sanitize_price_str(price_str)
    if not s:
        return None
    s = s.replace("€", "").strip().replace(",", ".")
    m = re.findall(r"[0-9]+(?:\.[0-9]+)?", s)
    if not m:
        return None
    try:
        return float(m[0])
    except Exception:
        return None

def extract_weight_kg(text: str) -> Optional[float]:
    t = text.lower().replace("\u00A0", " ")
    multi = re.findall(r"(\d+)\s*[x×]\s*(\d+(?:[\.,]\d+)?)\s*(kg|g)", t)
    if multi:
        total = 0.0
        for count, w, unit in multi:
            w = float(w.replace(",", "."))
            if unit == "g":
                w = w / 1000.0
            total += int(count) * w
        return total if total > 0 else None
    m = re.search(r"(\d+(?:[\.,]\d+)?)\s*(kg|g)\b", t)
    if m:
        w = float(m.group(1).replace(",", "."))
        if m.group(2) == "g":
            w = w / 1000.0
        return w
    return None


def parse_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return float(value)
        cleaned = str(value).strip().replace(",", ".")
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def parse_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        if isinstance(value, int):
            return value
        digits = re.findall(r"\d+", str(value))
        if not digits:
            return None
        return int(digits[0])
    except (ValueError, TypeError):
        return None


def format_numeric_price(amount: Optional[float], currency: Optional[str]) -> Optional[str]:
    if amount is None:
        return None
    cur = (currency or "EUR").upper()
    if cur == "EUR":
        return f"{amount:.2f} €"
    return f"{amount:.2f} {cur}"


def matches_query(name: str, query: Optional[str]) -> bool:
    if not query:
        return True
    normalized = name.lower()
    terms = [token for token in query.lower().split() if token]
    return all(term in normalized for term in terms)


def tokenize_keywords(value: Optional[str]) -> set[str]:
    if not value:
        return set()
    tokens = re.split(r"[^a-z0-9]+", value.lower())
    return {token for token in tokens if len(token) >= 3}


def fetch_scraper_products(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    def _with_limit(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if limit:
            return items[:limit]
        return items

    if SCRAPER_BASE_URL:
        try:
            response = requests.get(
                f"{SCRAPER_BASE_URL.rstrip('/')}/products", timeout=10
            )
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list) and data:
                return _with_limit(data)
        except Exception:
            pass

    return _with_limit(get_fallback_products())


def fetch_scraper_product_with_offers(product_id: int) -> Optional[Dict[str, Any]]:
    if SCRAPER_BASE_URL:
        try:
            response = requests.get(
                f"{SCRAPER_BASE_URL.rstrip('/')}/products/{product_id}/offers",
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            if isinstance(data, dict) and data:
                return data
        except Exception:
            pass

    return get_fallback_product(product_id)


def fetch_scraper_price_history(
    product_id: int,
    *,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date

    if SCRAPER_BASE_URL:
        try:
            response = requests.get(
                f"{SCRAPER_BASE_URL.rstrip('/')}/products/{product_id}/history",
                params=params,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list) and data:
                return data
        except Exception:
            pass

    fallback_history = get_fallback_price_history(product_id)
    if not fallback_history:
        return []

    def in_bounds(entry: Dict[str, Any]) -> bool:
        timestamp = entry.get("recorded_at")
        if not isinstance(timestamp, str):
            return False
        if start_date and timestamp < start_date:
            return False
        if end_date and timestamp > end_date:
            return False
        return True

    return [entry for entry in fallback_history if in_bounds(entry)]


def build_deal_payload(
    *,
    identifier: str,
    title: str,
    vendor: str,
    price_amount: Optional[float],
    price_currency: Optional[str],
    price_formatted: Optional[str],
    shipping_cost: Optional[float] = None,
    shipping_text: Optional[str] = None,
    in_stock: Optional[bool] = None,
    stock_status: Optional[str] = None,
    link: Optional[str],
    image: Optional[str],
    rating: Optional[float],
    reviews_count: Optional[int],
    source: str,
    product_id: Optional[int] = None,
    expires_at: Optional[str] = None,
    weight_kg: Optional[float] = None,
    price_per_kg: Optional[float] = None,
) -> Dict[str, Any]:
    total_price_amount: Optional[float] = None
    if price_amount is not None:
        total_price_amount = float(price_amount)
        if shipping_cost is not None:
            try:
                total_price_amount += float(shipping_cost)
            except (TypeError, ValueError):
                pass

    shipping_label = shipping_text
    if shipping_label is None and shipping_cost is not None:
        shipping_label = format_numeric_price(shipping_cost, price_currency)

    normalized_image = normalize_image_url(image)
    if normalized_image and looks_like_placeholder_image(normalized_image):
        normalized_image = None

    return {
        "id": identifier,
        "title": title,
        "vendor": vendor,
        "price": {
            "amount": price_amount,
            "currency": price_currency,
            "formatted": price_formatted,
        },
        "totalPrice": {
            "amount": total_price_amount,
            "currency": price_currency,
            "formatted": format_numeric_price(total_price_amount, price_currency),
        },
        "shippingCost": shipping_cost,
        "shippingText": shipping_label,
        "inStock": in_stock,
        "stockStatus": stock_status,
        "link": link,
        "image": normalized_image,
        "rating": rating,
        "reviewsCount": reviews_count,
        "bestPrice": False,
        "isBestPrice": False,
        "source": source,
        "productId": product_id,
        "expiresAt": expires_at,
        "weightKg": weight_kg,
        "pricePerKg": price_per_kg,
    }


def build_price_summary(
    amount: Optional[float], currency: Optional[str]
) -> Dict[str, Any]:
    return {
        "amount": amount,
        "currency": currency,
        "formatted": format_numeric_price(amount, currency),
    }


def mark_best_price(deals: List[Dict[str, Any]]) -> None:
    for deal in deals:
        deal["bestPrice"] = False
        deal["isBestPrice"] = False

    best_index: Optional[int] = None
    best_price: Optional[float] = None

    for idx, deal in enumerate(deals):
        amount_value = extract_total_price_amount(deal)
        if amount_value is None:
            continue
        if best_price is None or amount_value < best_price:
            best_price = amount_value
            best_index = idx

    if best_index is not None:
        deals[best_index]["bestPrice"] = True
        deals[best_index]["isBestPrice"] = True


def clone_deal_payload(deal: Dict[str, Any]) -> Dict[str, Any]:
    cloned = dict(deal)
    price = deal.get("price")
    if isinstance(price, dict):
        cloned["price"] = dict(price)
    total_price = deal.get("totalPrice")
    if isinstance(total_price, dict):
        cloned["totalPrice"] = dict(total_price)
    return cloned


def extract_total_price_amount(deal: Dict[str, Any]) -> Optional[float]:
    total_data = deal.get("totalPrice")
    if isinstance(total_data, dict):
        amount = total_data.get("amount")
        if amount is not None:
            try:
                return float(amount)
            except (ValueError, TypeError):
                pass

    price_data = deal.get("price") or {}
    base_amount = price_data.get("amount")
    if base_amount is None:
        return None

    try:
        total = float(base_amount)
    except (ValueError, TypeError):
        return None

    shipping_cost = deal.get("shippingCost")
    shipping_amount = parse_float(shipping_cost)
    if shipping_amount is not None:
        total += shipping_amount

    return total


def collect_serp_deals(
    q: str,
    marque: Optional[str] = None,
    categorie: Optional[str] = None,
    limit: int = 12,
) -> List[Dict[str, Any]]:
    shop = serpapi_shopping(q)
    if "error" in shop:
        return []

    shopping_results = shop.get("shopping_results")
    if not isinstance(shopping_results, list):
        return []

    deals: List[Dict[str, Any]] = []
    for index, item in enumerate(shopping_results):
        best: Optional[Dict[str, Any]] = None
        title = (item.get("title") or "").strip()
        title_lower = title.lower()

        if marque and marque.lower() not in title_lower:
            continue
        if categorie and categorie.lower() not in title_lower:
            continue

        product_id = item.get("product_id")

        image_candidates: List[Optional[str]] = [
            item.get("thumbnail"),
            item.get("image"),
        ]

        product_photos = item.get("product_photos")
        if isinstance(product_photos, list):
            for photo in product_photos:
                if isinstance(photo, dict):
                    image_candidates.extend(
                        photo.get(key)
                        for key in ("image", "link", "thumbnail", "source")
                    )

        g_price = sanitize_price_str(item.get("price"))
        source_name = item.get("source") or item.get("merchant") or "Vendeur"
        display_link = decode_google_redirect(
            item.get("product_link") or item.get("link")
        )

        price_str = g_price
        price_num = price_to_float(price_str)
        rating_val = parse_float(item.get("rating"))
        reviews_count = parse_int(item.get("reviews"))

        prod: Optional[Dict[str, Any]] = None
        if product_id:
            prod = serpapi_product_offers(str(product_id))
            sellers_results = prod.get("sellers_results") or {}
            online_sellers = sellers_results.get("online_sellers")
            offers = online_sellers if isinstance(online_sellers, list) else []
            best = pick_best_offer(offers)
            if best:
                display_link = best.get("direct_link") or display_link
                raw_total = (
                    best.get("total_price")
                    or best.get("base_price")
                    or g_price
                )
                price_str = sanitize_price_str(raw_total)
                best_price_num = price_to_float(price_str)
                price_num = best_price_num if best_price_num is not None else price_num
                source_name = best.get("name") or source_name
                rating_val = parse_float(best.get("rating") or rating_val)
                reviews_count = parse_int(best.get("reviews") or reviews_count)

            product_results = prod.get("product_results") if isinstance(prod, dict) else {}
            if isinstance(product_results, dict):
                media = product_results.get("media", [])
                if isinstance(media, list):
                    for media_item in media:
                        if isinstance(media_item, dict) and media_item.get("type") == "image":
                            image_candidates.extend(
                                media_item.get(key)
                                for key in ("link", "image", "thumbnail", "source")
                            )

                inline_images = product_results.get("inline_images", [])
                if isinstance(inline_images, list):
                    for image_item in inline_images:
                        if isinstance(image_item, dict):
                            image_candidates.extend(
                                image_item.get(key)
                                for key in ("image", "link", "thumbnail", "source")
                            )

                product_images = product_results.get("images", [])
                if isinstance(product_images, list):
                    for image_item in product_images:
                        if isinstance(image_item, dict):
                            image_candidates.extend(
                                image_item.get(key)
                                for key in ("link", "image", "thumbnail", "source")
                            )

        if not is_http_url(display_link):
            display_link = None

        weight_kg = (
            extract_weight_kg(title)
            or extract_weight_kg(q)
            or None
        )
        eur_per_kg = (
            round(price_num / weight_kg, 2)
            if price_num is not None and weight_kg
            else None
        )

        availability_text = item.get("availability") or None
        if best and best.get("availability"):
            availability_text = best.get("availability")

        stock_status = availability_text
        in_stock = None
        if availability_text:
            normalized_availability = str(availability_text).lower()
            in_stock = any(
                keyword in normalized_availability
                for keyword in ("stock", "available", "disponible")
            )

        shipping_text = item.get("shipping") or None
        shipping_cost = None
        if best:
            shipping_text = best.get("shipping") or shipping_text
            shipping_cost = parse_float(best.get("shipping_cost"))

        deals.append(
            build_deal_payload(
                identifier=f"google-{product_id or 'item'}-{index}",
                title=title or item.get("title") or "Produit",
                vendor=source_name,
                price_amount=price_num,
                price_currency="EUR" if price_num is not None else None,
                price_formatted=price_str,
                shipping_cost=shipping_cost,
                shipping_text=shipping_text,
                in_stock=in_stock,
                stock_status=stock_status,
                link=display_link,
                image=pick_best_image_candidate(image_candidates),
                rating=rating_val,
                reviews_count=reviews_count,
                source="Google Shopping",
                product_id=int(product_id) if product_id else None,
                weight_kg=weight_kg,
                price_per_kg=eur_per_kg,
            )
        )

        if len(deals) >= max(limit * 2, limit):
            break

    return deals


def convert_scraper_offer_to_deal(
    product: Dict[str, Any], offer: Dict[str, Any], *, index: int = 0
) -> Dict[str, Any]:
    product_id = product.get("id")
    product_name = product.get("name") or "Produit"
    brand = product.get("brand")
    title = f"{brand} - {product_name}" if brand else product_name

    price_amount = parse_float(offer.get("price"))
    currency = offer.get("currency") or "EUR"
    source_name = offer.get("source") or "Marchand"
    shipping_cost = parse_float(offer.get("shipping_cost"))
    shipping_text = offer.get("shipping_text") or None
    in_stock = offer.get("in_stock")
    if in_stock is None and offer.get("stock_status"):
        status_value = str(offer.get("stock_status")).lower()
        in_stock = any(
            keyword in status_value for keyword in ("stock", "disponible", "available")
        )

    identifier = f"scraper-{product_id}-{offer.get('id', index)}"

    return build_deal_payload(
        identifier=identifier,
        title=title,
        vendor=source_name.title(),
        price_amount=price_amount,
        price_currency=currency,
        price_formatted=format_numeric_price(price_amount, currency),
        shipping_cost=shipping_cost,
        shipping_text=shipping_text,
        in_stock=in_stock,
        stock_status=offer.get("stock_status"),
        link=offer.get("url"),
        image=offer.get("image"),
        rating=parse_float(offer.get("rating")),
        reviews_count=parse_int(offer.get("reviews")),
        source=f"{source_name.title()} (Scraper)",
        product_id=int(product_id) if product_id is not None else None,
    )


def aggregate_offers_for_product(
    product: Dict[str, Any], *, limit: int = 10
) -> List[Dict[str, Any]]:
    offers = product.get("offers")
    scraper_deals = (
        [
            convert_scraper_offer_to_deal(product, offer, index=index)
            for index, offer in enumerate(offers)
        ]
        if isinstance(offers, list)
        else []
    )

    name = product.get("name") or ""
    brand = product.get("brand")
    serp_deals = collect_serp_deals(
        name,
        marque=brand,
        limit=limit,
    )

    combined = scraper_deals + serp_deals
    combined.sort(
        key=lambda deal: (
            extract_total_price_amount(deal)
            if extract_total_price_amount(deal) is not None
            else float("inf")
        )
    )

    mark_best_price(combined)
    return combined[:limit]


def build_product_summary(
    product: Dict[str, Any], *, offer_limit: int = 10
) -> Dict[str, Any]:
    base_payload = serialize_product(product)
    product_id = base_payload.get("id")
    detail = fetch_scraper_product_with_offers(product_id) if product_id else None

    aggregated: List[Dict[str, Any]] = []
    if detail:
        aggregated = aggregate_offers_for_product(detail, limit=offer_limit)

    best_offer: Optional[Dict[str, Any]] = None
    for deal in aggregated:
        if deal.get("isBestPrice"):
            best_offer = deal
            break
    if best_offer is None and aggregated:
        best_offer = aggregated[0]

    best_price_amount: Optional[float] = None
    best_currency: Optional[str] = None
    best_formatted: Optional[str] = None
    total_price_payload: Optional[Dict[str, Any]] = None

    if best_offer:
        total_price_payload = best_offer.get("totalPrice")
        if isinstance(total_price_payload, dict) and (
            total_price_payload.get("amount") is not None
        ):
            best_price_amount = parse_float(total_price_payload.get("amount"))
            best_currency = total_price_payload.get("currency")
            best_formatted = total_price_payload.get("formatted")

        if best_price_amount is None:
            price_payload = best_offer.get("price") or {}
            amount = price_payload.get("amount")
            if amount is not None:
                best_price_amount = parse_float(amount)
                best_currency = price_payload.get("currency")
                best_formatted = price_payload.get("formatted")

    if best_formatted is None and best_price_amount is not None:
        best_formatted = format_numeric_price(best_price_amount, best_currency)

    protein_per_serving = parse_float(base_payload.get("protein_per_serving_g"))
    protein_per_euro: Optional[float] = None
    if (
        protein_per_serving is not None
        and protein_per_serving > 0
        and best_price_amount is not None
        and best_price_amount > 0
    ):
        protein_per_euro = round(protein_per_serving / best_price_amount, 2)

    rating_value = parse_float(best_offer.get("rating")) if best_offer else None
    reviews_value = (
        parse_int(best_offer.get("reviewsCount")) if best_offer else None
    )
    in_stock_value = best_offer.get("inStock") if best_offer else None
    stock_status_value = best_offer.get("stockStatus") if best_offer else None
    price_per_kg = (
        parse_float(best_offer.get("pricePerKg")) if best_offer else None
    )

    best_price_payload = {
        "amount": best_price_amount,
        "currency": best_currency,
        "formatted": best_formatted,
    }

    image_candidates: List[Optional[str]] = [base_payload.get("image")]

    if best_offer and isinstance(best_offer, dict):
        image_candidates.append(best_offer.get("image"))

    for deal in aggregated:
        if not isinstance(deal, dict):
            continue
        image_candidates.append(deal.get("image"))

    product_image = resolve_image_with_placeholder(
        image_candidates,
        name=base_payload.get("name"),
        brand=base_payload.get("brand"),
    )

    return {
        **base_payload,
        "image": product_image,
        "category": base_payload.get("category"),
        "bestPrice": best_price_payload,
        "bestDeal": best_offer,
        "offersCount": len(aggregated),
        "inStock": in_stock_value,
        "stockStatus": stock_status_value,
        "rating": rating_value,
        "reviewsCount": reviews_value,
        "proteinPerEuro": protein_per_euro,
        "pricePerKg": price_per_kg,
        "bestVendor": best_offer.get("vendor") if best_offer else None,
        "totalPrice": total_price_payload,
    }


def serialize_product(product: Dict[str, Any]) -> Dict[str, Any]:
    keys = [
        "id",
        "name",
        "brand",
        "flavour",
        "image",
        "protein_per_serving_g",
        "serving_size_g",
        "category",
    ]
    payload = {key: product.get(key) for key in keys}

    offers = product.get("offers")
    image_candidates: List[Optional[str]] = [payload.get("image")]

    if isinstance(offers, list):
        for offer in offers:
            if not isinstance(offer, dict):
                continue
            image_candidates.append(offer.get("image"))

    payload["image"] = resolve_image_with_placeholder(
        image_candidates,
        name=payload.get("name"),
        brand=payload.get("brand"),
    )
    return payload


def compute_similarity_score(
    base: Dict[str, Any], candidate: Dict[str, Any]
) -> float:
    score = 0.0

    base_brand = (base.get("brand") or "").strip().lower()
    candidate_brand = (candidate.get("brand") or "").strip().lower()
    if base_brand and candidate_brand:
        if base_brand == candidate_brand:
            score += 3.0
        elif base_brand in candidate_brand or candidate_brand in base_brand:
            score += 1.5

    base_category = (base.get("category") or "").strip().lower()
    candidate_category = (candidate.get("category") or "").strip().lower()
    if base_category and candidate_category and base_category == candidate_category:
        score += 1.5

    base_tokens = tokenize_keywords(base.get("name"))
    candidate_tokens = tokenize_keywords(candidate.get("name"))
    if base_tokens and candidate_tokens:
        overlap = base_tokens & candidate_tokens
        if overlap:
            score += 2.0 * len(overlap) / max(len(base_tokens), 1)

    base_flavour = tokenize_keywords(base.get("flavour"))
    candidate_flavour = tokenize_keywords(candidate.get("flavour"))
    if base_flavour and candidate_flavour:
        flavour_overlap = base_flavour & candidate_flavour
        if flavour_overlap:
            score += 1.0

    base_protein = parse_float(base.get("protein_per_serving_g"))
    candidate_protein = parse_float(candidate.get("protein_per_serving_g"))
    if (
        base_protein is not None
        and candidate_protein is not None
        and abs(base_protein - candidate_protein) <= 2
    ):
        score += 0.5

    return score


def find_related_products(
    products: List[Dict[str, Any]],
    base_product: Dict[str, Any],
    *,
    limit: int,
) -> List[Dict[str, Any]]:
    base_id = base_product.get("id")
    if base_id is None:
        return []

    scored_candidates: List[tuple[float, Dict[str, Any]]] = []
    for candidate in products:
        if candidate is base_product:
            continue
        candidate_id = candidate.get("id")
        if candidate_id is None or candidate_id == base_id:
            continue
        score = compute_similarity_score(base_product, candidate)
        if score <= 0:
            continue
        scored_candidates.append((score, candidate))

    if not scored_candidates:
        fallback = [
            product
            for product in products
            if product is not base_product and product.get("id") != base_id
        ]
        scored_candidates = [(0.0, product) for product in fallback[: limit * 2]]
    else:
        scored_candidates.sort(key=lambda item: item[0], reverse=True)

    related_summaries: List[Dict[str, Any]] = []
    for _, candidate in scored_candidates:
        summary = build_product_summary(candidate, offer_limit=6)
        related_summaries.append(summary)
        if len(related_summaries) >= limit:
            break

    return related_summaries


def collect_scraper_deals(q: str, limit: int = 12) -> List[Dict[str, Any]]:
    deals: List[Dict[str, Any]] = []
    products = fetch_scraper_products()
    if not products:
        return deals

    filtered_products = [
        product
        for product in products
        if matches_query(product.get("name", ""), q)
    ]

    if not filtered_products:
        filtered_products = products

    for product in filtered_products:
        product_id = product.get("id")
        if product_id is None:
            continue

        detail = fetch_scraper_product_with_offers(int(product_id))
        if not detail:
            continue

        offers = detail.get("offers")
        if not isinstance(offers, list):
            continue

        for index, offer in enumerate(offers):
            deals.append(
                convert_scraper_offer_to_deal(detail, offer, index=index)
            )

            if len(deals) >= max(limit * 2, limit):
                return deals

    return deals

@lru_cache(maxsize=64)
def serpapi_shopping(q: str, hl: str = "fr", gl: str = "fr") -> Dict[str, Any]:
    params = {"engine": "google_shopping", "q": q, "hl": hl, "gl": gl, "api_key": SERPAPI_KEY}
    r = requests.get(SERPAPI_BASE, params=params, timeout=30)
    try:
        return r.json()
    except Exception:
        return {"error": "Réponse non JSON de SerpAPI", "text": r.text, "status": r.status_code}

@lru_cache(maxsize=128)
def serpapi_product_offers(product_id: str, hl: str = "fr", gl: str = "fr") -> Dict[str, Any]:
    params = {"engine": "google_product", "product_id": product_id, "offers": "1", "hl": hl, "gl": gl, "api_key": SERPAPI_KEY}
    r = requests.get(SERPAPI_BASE, params=params, timeout=30)
    try:
        return r.json()
    except Exception:
        return {"error": "Réponse non JSON (google_product)", "text": r.text, "status": r.status_code}

def pick_best_offer(offers: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not offers:
        return None
    cleaned = []
    for o in offers:
        link = decode_google_redirect(o.get("link") or "")
        base_price = price_to_float(o.get("base_price")) or price_to_float(o.get("price"))
        total_price = price_to_float(o.get("total_price")) or base_price
        cleaned.append({**o, "direct_link": link, "price_num": base_price, "total_price_num": total_price})
    for o in cleaned:
        try:
            host = urlparse(o["direct_link"]).netloc.lower()
            if any(dom in host for dom in PREFERRED_DOMAINS):
                return o
        except Exception:
            continue
    cleaned.sort(key=lambda x: (x["total_price_num"] if x["total_price_num"] is not None else 1e12))
    return cleaned[0]

# --- Routes ---

@app.get("/")
def home():
    return {"message": "API OK ✅ — utilise /compare?q=whey protein"}

@app.get("/compare")
def compare(
    q: str = Query("whey protein"),
    marque: Optional[str] = Query(None),
    categorie: Optional[str] = Query(None),
    limit: int = Query(12, ge=1, le=24)
):
    serp_deals = collect_serp_deals(q, marque=marque, categorie=categorie, limit=limit)
    scraper_deals = collect_scraper_deals(q, limit=limit)

    combined = serp_deals + scraper_deals
    combined.sort(
        key=lambda deal: (
            deal.get("price", {}).get("amount")
            if deal.get("price", {}).get("amount") is not None
            else float("inf")
        )
    )

    mark_best_price(combined)
    return combined[:limit]


@app.get("/products")
def list_products(
    search: Optional[str] = Query(None, description="Recherche nom ou marque"),
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=60),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    brands: Optional[List[str]] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    in_stock: Optional[bool] = Query(None),
    category: Optional[str] = Query(None),
    sort: Optional[str] = Query("price_asc"),
):
    products = fetch_scraper_products()

    if search:
        products = [
            product
            for product in products
            if matches_query(product.get("name") or "", search)
            or matches_query(product.get("brand") or "", search)
        ]

    brand_filter: Optional[set[str]] = None
    if brands:
        brand_filter = {value.lower() for value in brands if value}

    category_filter = category.lower() if category else None

    enriched_products: List[Dict[str, Any]] = [
        build_product_summary(product) for product in products
    ]

    def price_in_range(item: Dict[str, Any]) -> bool:
        best_price = item.get("bestPrice") or {}
        amount = best_price.get("amount")
        if amount is None:
            return min_price is None and max_price is None
        try:
            value = float(amount)
        except (TypeError, ValueError):
            return False
        if min_price is not None and value < min_price:
            return False
        if max_price is not None and value > max_price:
            return False
        return True

    filtered = []
    for item in enriched_products:
        if brand_filter and (item.get("brand") or "").lower() not in brand_filter:
            continue
        if category_filter:
            product_category = (item.get("category") or "").lower()
            if category_filter not in product_category:
                continue
        if not price_in_range(item):
            continue
        if min_rating is not None:
            rating = item.get("rating")
            if rating is None or rating < min_rating:
                continue
        if in_stock is not None:
            available = item.get("inStock")
            if available is None:
                if in_stock:
                    continue
            elif available != in_stock:
                continue
        filtered.append(item)

    def best_price_amount(value: Dict[str, Any]) -> Optional[float]:
        amount = value.get("bestPrice", {}).get("amount")
        if amount is None:
            return None
        try:
            return float(amount)
        except (TypeError, ValueError):
            return None

    sort_key = (sort or "price_asc").lower()
    if sort_key == "price_desc":
        filtered.sort(
            key=lambda item: (
                best_price_amount(item)
                if best_price_amount(item) is not None
                else -float("inf")
            ),
            reverse=True,
        )
    elif sort_key == "rating":
        filtered.sort(
            key=lambda item: (item.get("rating") or 0.0),
            reverse=True,
        )
    elif sort_key == "protein_ratio":
        filtered.sort(
            key=lambda item: (item.get("proteinPerEuro") or 0.0),
            reverse=True,
        )
    else:  # default price ascending
        filtered.sort(
            key=lambda item: (
                best_price_amount(item)
                if best_price_amount(item) is not None
                else float("inf")
            )
        )

    total = len(filtered)
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = min(max(page, 1), total_pages)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = filtered[start:end]

    return {
        "products": paginated,
        "pagination": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": total_pages,
            "hasPrevious": page > 1,
            "hasNext": page < total_pages,
        },
    }


@app.get("/products/{product_id}/offers")
def product_offers_endpoint(
    product_id: int,
    limit: int = Query(10, ge=1, le=24),
):
    detail = fetch_scraper_product_with_offers(product_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    product_payload = serialize_product(detail)
    aggregated = aggregate_offers_for_product(detail, limit=limit)
    scraper_offers = detail.get("offers")
    if not isinstance(scraper_offers, list):
        scraper_offers = []

    return {
        "product": product_payload,
        "offers": aggregated,
        "sources": {
            "scraper": scraper_offers,
        },
    }


@app.get("/products/{product_id}/related")
def related_products_endpoint(
    product_id: int,
    limit: int = Query(4, ge=1, le=12),
):
    products = fetch_scraper_products()
    base_product: Optional[Dict[str, Any]] = None
    for product in products:
        try:
            if int(product.get("id")) == product_id:
                base_product = product
                break
        except (TypeError, ValueError):
            continue

    if base_product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    related = find_related_products(products, base_product, limit=limit)

    return {
        "productId": product_id,
        "related": related,
    }


@app.get("/products/{product_id}/price-history")
def product_price_history_endpoint(
    product_id: int,
    period: Optional[str] = Query("3m", description="Période 7d/1m/3m/6m/1y/all"),
):
    normalized_period = (period or "all").lower()
    if normalized_period not in PRICE_HISTORY_PERIODS and normalized_period != "all":
        normalized_period = "all"

    end_dt = datetime.utcnow()
    start_iso: Optional[str] = None
    if normalized_period in PRICE_HISTORY_PERIODS:
        delta = PRICE_HISTORY_PERIODS[normalized_period]
        start_dt = end_dt - delta
        start_iso = isoformat_utc(start_dt)

    history_entries = fetch_scraper_price_history(
        product_id,
        start_date=start_iso,
    )

    points: List[Dict[str, Any]] = []
    for entry in history_entries:
        recorded_at = entry.get("recorded_at") or entry.get("recordedAt")
        price_amount = parse_float(entry.get("price"))
        currency = entry.get("currency") or "EUR"
        if recorded_at is None or price_amount is None:
            continue
        points.append(
            {
                "recordedAt": recorded_at,
                "source": entry.get("source"),
                "price": build_price_summary(price_amount, currency),
            }
        )

    points.sort(key=lambda point: point.get("recordedAt") or "")
    price_values = [
        point["price"]["amount"]
        for point in points
        if point.get("price", {}).get("amount") is not None
    ]

    stats_currency = points[-1]["price"]["currency"] if points else "EUR"
    lowest = min(price_values) if price_values else None
    highest = max(price_values) if price_values else None
    average = (
        round(sum(price_values) / len(price_values), 2)
        if price_values
        else None
    )
    current = price_values[-1] if price_values else None

    return {
        "productId": product_id,
        "period": normalized_period,
        "points": points,
        "statistics": {
            "lowest": build_price_summary(lowest, stats_currency),
            "highest": build_price_summary(highest, stats_currency),
            "average": build_price_summary(average, stats_currency),
            "current": build_price_summary(current, stats_currency),
        },
    }


@app.get("/comparison")
def comparison_endpoint(
    ids: str = Query(..., description="Identifiants produit séparés par des virgules"),
    limit: int = Query(10, ge=1, le=24),
):
    id_values: List[int] = []
    for raw in ids.split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            id_values.append(int(raw))
        except ValueError:
            continue

    if not id_values:
        raise HTTPException(status_code=400, detail="Aucun identifiant valide fourni")

    products_payload: List[Dict[str, Any]] = []
    summary: List[Dict[str, Any]] = []

    for product_id in id_values:
        detail = fetch_scraper_product_with_offers(product_id)
        if not detail:
            continue

        product_payload = serialize_product(detail)
        aggregated = aggregate_offers_for_product(detail, limit=limit)

        products_payload.append({
            "product": product_payload,
            "offers": aggregated,
        })

        summary.extend(clone_deal_payload(deal) for deal in aggregated)

    summary.sort(
        key=lambda deal: (
            deal.get("price", {}).get("amount")
            if deal.get("price", {}).get("amount") is not None
            else float("inf")
        )
    )
    mark_best_price(summary)

    return {
        "products": products_payload,
        "summary": summary[:limit],
    }
