from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os, re
import requests
from urllib.parse import urlparse, parse_qs
from functools import lru_cache
from typing import Dict, Any, List, Optional

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

# Domaines que l’on préfère (priorisation quand plusieurs vendeurs)
PREFERRED_DOMAINS = [
    "myprotein.fr",
    "prozis.com",
    "decathlon.fr",
    "nutrimuscle.com",
]

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


def fetch_scraper_products(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    if not SCRAPER_BASE_URL:
        return []

    try:
        response = requests.get(
            f"{SCRAPER_BASE_URL.rstrip('/')}/products", timeout=10
        )
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, list):
            return []
        return data[:limit] if limit else data
    except Exception:
        return []


def fetch_scraper_product_with_offers(product_id: int) -> Optional[Dict[str, Any]]:
    if not SCRAPER_BASE_URL:
        return None

    try:
        response = requests.get(
            f"{SCRAPER_BASE_URL.rstrip('/')}/products/{product_id}/offers",
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict):
            return None
        return data
    except Exception:
        return None


def build_deal_payload(
    *,
    identifier: str,
    title: str,
    vendor: str,
    price_amount: Optional[float],
    price_currency: Optional[str],
    price_formatted: Optional[str],
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
    return {
        "id": identifier,
        "title": title,
        "vendor": vendor,
        "price": {
            "amount": price_amount,
            "currency": price_currency,
            "formatted": price_formatted,
        },
        "link": link,
        "image": image,
        "rating": rating,
        "reviewsCount": reviews_count,
        "bestPrice": False,
        "source": source,
        "productId": product_id,
        "expiresAt": expires_at,
        "weightKg": weight_kg,
        "pricePerKg": price_per_kg,
    }


def mark_best_price(deals: List[Dict[str, Any]]) -> None:
    for deal in deals:
        deal["bestPrice"] = False

    best_index: Optional[int] = None
    best_price: Optional[float] = None

    for idx, deal in enumerate(deals):
        price_data = deal.get("price") or {}
        amount = price_data.get("amount")
        if amount is None:
            continue
        try:
            amount_value = float(amount)
        except (ValueError, TypeError):
            continue
        if best_price is None or amount_value < best_price:
            best_price = amount_value
            best_index = idx

    if best_index is not None:
        deals[best_index]["bestPrice"] = True


def clone_deal_payload(deal: Dict[str, Any]) -> Dict[str, Any]:
    cloned = dict(deal)
    price = deal.get("price")
    if isinstance(price, dict):
        cloned["price"] = dict(price)
    return cloned


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
        title = (item.get("title") or "").strip()
        title_lower = title.lower()

        if marque and marque.lower() not in title_lower:
            continue
        if categorie and categorie.lower() not in title_lower:
            continue

        product_id = item.get("product_id")
        img = item.get("thumbnail")
        g_price = sanitize_price_str(item.get("price"))
        source_name = item.get("source") or item.get("merchant") or "Vendeur"
        display_link = decode_google_redirect(
            item.get("product_link") or item.get("link")
        )

        price_str = g_price
        price_num = price_to_float(price_str)
        rating_val = parse_float(item.get("rating"))
        reviews_count = parse_int(item.get("reviews"))

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

            if not img:
                media = (prod.get("product_results") or {}).get("media", [])
                if isinstance(media, list):
                    for media_item in media:
                        if (
                            isinstance(media_item, dict)
                            and media_item.get("type") == "image"
                            and media_item.get("link")
                        ):
                            img = media_item["link"]
                            break

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

        deals.append(
            build_deal_payload(
                identifier=f"google-{product_id or 'item'}-{index}",
                title=title or item.get("title") or "Produit",
                vendor=source_name,
                price_amount=price_num,
                price_currency="EUR" if price_num is not None else None,
                price_formatted=price_str,
                link=display_link,
                image=img,
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

    identifier = f"scraper-{product_id}-{offer.get('id', index)}"

    return build_deal_payload(
        identifier=identifier,
        title=title,
        vendor=source_name.title(),
        price_amount=price_amount,
        price_currency=currency,
        price_formatted=format_numeric_price(price_amount, currency),
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
            deal.get("price", {}).get("amount")
            if deal.get("price", {}).get("amount") is not None
            else float("inf")
        )
    )

    mark_best_price(combined)
    return combined[:limit]


def serialize_product(product: Dict[str, Any]) -> Dict[str, Any]:
    keys = [
        "id",
        "name",
        "brand",
        "flavour",
        "protein_per_serving_g",
        "serving_size_g",
    ]
    return {key: product.get(key) for key in keys}


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
    search: Optional[str] = Query(None, description="Filtrer par nom"),
    limit: int = Query(50, ge=1, le=200),
):
    products = fetch_scraper_products()
    if search:
        search_lower = search.lower()
        products = [
            product
            for product in products
            if search_lower in (product.get("name") or "").lower()
        ]

    serialized = [serialize_product(product) for product in products]
    return serialized[:limit]


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
