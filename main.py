from fastapi import FastAPI, Query
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
    shop = serpapi_shopping(q)
    if "error" in shop:
        return {"error": f"SerpAPI: {shop['error']}", "raw": shop}
    if "shopping_results" not in shop:
        return {"error": "Pas de shopping_results", "raw": shop}

    out: List[Dict[str, Any]] = []
    for item in shop.get("shopping_results", []):
        title = (item.get("title") or "").lower()
        if marque and marque.lower() not in title:
            continue
        if categorie and categorie.lower() not in title:
            continue

        product_id = item.get("product_id")
        img = item.get("thumbnail")
        g_price = sanitize_price_str(item.get("price"))
        source = item.get("source") or "Vendeur"

        display_link = None
        price_str = g_price
        price_num = price_to_float(price_str)

        if product_id:
            prod = serpapi_product_offers(str(product_id))
            sellers_results = (prod.get("sellers_results") or {})
            offers = sellers_results.get("online_sellers", []) if isinstance(sellers_results.get("online_sellers"), list) else []
            best = pick_best_offer(offers)
            if best:
                display_link = best.get("direct_link")
                price_str = sanitize_price_str(best.get("total_price") or best.get("base_price") or g_price)
                price_num = price_to_float(price_str)
                source = best.get("name") or source
            if not img:
                media = (prod.get("product_results") or {}).get("media", [])
                if isinstance(media, list):
                    for m in media:
                        if m.get("type") == "image" and m.get("link"):
                            img = m["link"]
                            break

        if not display_link:
            display_link = decode_google_redirect(item.get("product_link") or item.get("link"))

        if not is_http_url(display_link):
            display_link = None

        weight_kg = extract_weight_kg(item.get("title") or "") or extract_weight_kg(q) or None
        eur_per_kg = (price_num / weight_kg) if (price_num and weight_kg and weight_kg > 0) else None

        out.append({
            "site": source,
            "nom": item.get("title") or "Produit",
            "prix": price_str or "N/A",
            "prix_num": price_num,
            "image": img,
            "lien": display_link,
            "poids_kg": weight_kg,
            "eur_par_kg": round(eur_per_kg, 2) if eur_per_kg else None,
        })

        if len(out) >= limit:
            break

    out.sort(key=lambda x: (x["prix_num"] if x["prix_num"] is not None else 1e12))
    return out
