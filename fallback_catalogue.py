"""Fallback catalogue data used when the scraper service is unavailable."""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List, Optional

FALLBACK_PRODUCTS: List[Dict[str, Any]] = [
    {
        "id": 101,
        "name": "Impact Whey Isolate 1 kg",
        "brand": "MyProtein",
        "flavour": "Vanille",
        "category": "whey-protein",
        "image": "https://images.unsplash.com/photo-1586402187872-4ebc2c4f7caf?auto=format&fit=crop&w=600&q=80",
        "protein_per_serving_g": 23.0,
        "serving_size_g": 25.0,
        "offers": [
            {
                "id": "mp-impact-vanilla",
                "source": "MyProtein",
                "price": 29.99,
                "currency": "EUR",
                "url": "https://www.myprotein.fr/sports-nutrition/impact-whey-isolate/10852501.html",
                "in_stock": True,
                "stock_status": "En stock",
                "shipping_cost": 4.99,
                "shipping_text": "Livraison 4,99 €",
                "rating": 4.6,
                "reviews": 1523,
                "image": "https://images.unsplash.com/photo-1526402467855-1d8db87a98e7?auto=format&fit=crop&w=600&q=80",
            },
            {
                "id": "amazon-impact-vanilla",
                "source": "Amazon",
                "price": 32.49,
                "currency": "EUR",
                "url": "https://www.amazon.fr/dp/B00PYX0K5W",
                "in_stock": True,
                "stock_status": "Expédié sous 24h",
                "shipping_cost": 0.0,
                "shipping_text": "Livraison gratuite Prime",
                "rating": 4.7,
                "reviews": 1984,
                "image": "https://images.unsplash.com/photo-1598966733525-05cbe7d5ac26?auto=format&fit=crop&w=600&q=80",
            },
        ],
    },
    {
        "id": 102,
        "name": "100% Whey Gold Standard 908 g",
        "brand": "Optimum Nutrition",
        "flavour": "Double chocolat",
        "category": "whey-protein",
        "image": "https://images.unsplash.com/photo-1517638851339-4aa32003c11a?auto=format&fit=crop&w=600&q=80",
        "protein_per_serving_g": 24.0,
        "serving_size_g": 30.0,
        "offers": [
            {
                "id": "on-gold-standard",
                "source": "Decathlon",
                "price": 39.99,
                "currency": "EUR",
                "url": "https://www.decathlon.fr/p/whey-gold-standard-908g/_/R-p-X8735034",
                "in_stock": True,
                "stock_status": "Disponible en magasin",
                "shipping_cost": 4.5,
                "shipping_text": "Livraison 4,50 €",
                "rating": 4.8,
                "reviews": 421,
                "image": "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=600&q=80",
            },
            {
                "id": "amazon-gold-standard",
                "source": "Amazon",
                "price": 42.90,
                "currency": "EUR",
                "url": "https://www.amazon.fr/dp/B002DYIZEO",
                "in_stock": True,
                "stock_status": "En stock",
                "shipping_cost": 0.0,
                "shipping_text": "Livraison gratuite",
                "rating": 4.7,
                "reviews": 1652,
                "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80",
            },
        ],
    },
    {
        "id": 103,
        "name": "Native Whey 1,5 kg",
        "brand": "Nutrimuscle",
        "flavour": "Fraise",
        "category": "whey-protein",
        "image": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
        "protein_per_serving_g": 25.0,
        "serving_size_g": 30.0,
        "offers": [
            {
                "id": "nutrimuscle-native",
                "source": "Nutrimuscle",
                "price": 44.90,
                "currency": "EUR",
                "url": "https://www.nutrimuscle.com/products/whey-proteine-native",
                "in_stock": True,
                "stock_status": "Expédition 24h",
                "shipping_cost": 5.90,
                "shipping_text": "Livraison 5,90 €",
                "rating": 4.9,
                "reviews": 239,
                "image": "https://images.unsplash.com/photo-1517346884665-158c4275efc0?auto=format&fit=crop&w=600&q=80",
            },
            {
                "id": "amazon-native",
                "source": "Amazon",
                "price": 47.50,
                "currency": "EUR",
                "url": "https://www.amazon.fr/dp/B07CZG1M3R",
                "in_stock": True,
                "stock_status": "En stock",
                "shipping_cost": 0.0,
                "shipping_text": "Livraison gratuite",
                "rating": 4.6,
                "reviews": 512,
                "image": "https://images.unsplash.com/photo-1594031037154-0d1077ab55a9?auto=format&fit=crop&w=600&q=80",
            },
        ],
    },
    {
        "id": 104,
        "name": "Whey Isolate Zero 900 g",
        "brand": "Prozis",
        "flavour": "Cookies & Cream",
        "category": "whey-protein",
        "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "protein_per_serving_g": 26.0,
        "serving_size_g": 30.0,
        "offers": [
            {
                "id": "prozis-isolate-zero",
                "source": "Prozis",
                "price": 32.99,
                "currency": "EUR",
                "url": "https://www.prozis.com/fr/fr/prozis/whey-isolate-zero-900-g",
                "in_stock": True,
                "stock_status": "En stock",
                "shipping_cost": 5.99,
                "shipping_text": "Livraison 5,99 €",
                "rating": 4.5,
                "reviews": 867,
                "image": "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=600&q=80",
            },
            {
                "id": "cdiscount-isolate-zero",
                "source": "Cdiscount",
                "price": 35.50,
                "currency": "EUR",
                "url": "https://www.cdiscount.com/dps/prozis-whey-isolate-zero",
                "in_stock": True,
                "stock_status": "Expédié sous 48h",
                "shipping_cost": 3.99,
                "shipping_text": "Livraison 3,99 €",
                "rating": 4.3,
                "reviews": 143,
                "image": "https://images.unsplash.com/photo-1580915411954-282cb1c9fcd0?auto=format&fit=crop&w=600&q=80",
            },
        ],
    },
    {
        "id": 105,
        "name": "Clear Whey Isolate 875 g",
        "brand": "Foodspring",
        "flavour": "Citron",
        "category": "clear-whey",
        "image": "https://images.unsplash.com/photo-1579722821273-0f7c4f2f8761?auto=format&fit=crop&w=600&q=80",
        "protein_per_serving_g": 20.0,
        "serving_size_g": 25.0,
        "offers": [
            {
                "id": "foodspring-clear-whey",
                "source": "Foodspring",
                "price": 34.99,
                "currency": "EUR",
                "url": "https://www.foodspring.fr/clear-whey",
                "in_stock": True,
                "stock_status": "En stock",
                "shipping_cost": 5.90,
                "shipping_text": "Livraison 5,90 €",
                "rating": 4.4,
                "reviews": 612,
                "image": "https://images.unsplash.com/photo-1558640472-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80",
            },
            {
                "id": "amazon-clear-whey",
                "source": "Amazon",
                "price": 36.50,
                "currency": "EUR",
                "url": "https://www.amazon.fr/dp/B094JBPQ8V",
                "in_stock": True,
                "stock_status": "En stock",
                "shipping_cost": 0.0,
                "shipping_text": "Livraison gratuite",
                "rating": 4.2,
                "reviews": 284,
                "image": "https://images.unsplash.com/photo-1468218629260-9d0b2a06a8b7?auto=format&fit=crop&w=600&q=80",
            },
        ],
    },
    {
        "id": 106,
        "name": "Isolate Native Cacao 1 kg",
        "brand": "Eric Favre",
        "flavour": "Cacao",
        "category": "whey-protein",
        "image": "https://images.unsplash.com/photo-1556909212-5b1eda1ccd48?auto=format&fit=crop&w=600&q=80",
        "protein_per_serving_g": 27.0,
        "serving_size_g": 30.0,
        "offers": [
            {
                "id": "eric-favre-isolate",
                "source": "Eric Favre",
                "price": 39.50,
                "currency": "EUR",
                "url": "https://www.ericfavre.com/laboratoire/fr/isolate-native",
                "in_stock": True,
                "stock_status": "En stock",
                "shipping_cost": 6.5,
                "shipping_text": "Livraison 6,50 €",
                "rating": 4.6,
                "reviews": 198,
                "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
            },
            {
                "id": "amazon-eric-favre",
                "source": "Amazon",
                "price": 41.90,
                "currency": "EUR",
                "url": "https://www.amazon.fr/dp/B01M1FMZLZ",
                "in_stock": True,
                "stock_status": "Expédié sous 24h",
                "shipping_cost": 0.0,
                "shipping_text": "Livraison gratuite",
                "rating": 4.5,
                "reviews": 341,
                "image": "https://images.unsplash.com/photo-1600185365483-26d7a5dc545b?auto=format&fit=crop&w=600&q=80",
            },
        ],
    },
]

FALLBACK_PRICE_HISTORY: Dict[int, List[Dict[str, Any]]] = {
    101: [
        {"recorded_at": "2023-12-15T08:00:00Z", "price": 33.99, "currency": "EUR", "source": "MyProtein"},
        {"recorded_at": "2024-01-15T08:00:00Z", "price": 32.49, "currency": "EUR", "source": "MyProtein"},
        {"recorded_at": "2024-02-15T08:00:00Z", "price": 31.99, "currency": "EUR", "source": "MyProtein"},
        {"recorded_at": "2024-03-15T08:00:00Z", "price": 30.49, "currency": "EUR", "source": "MyProtein"},
        {"recorded_at": "2024-04-15T08:00:00Z", "price": 29.99, "currency": "EUR", "source": "MyProtein"},
    ],
    102: [
        {"recorded_at": "2023-12-01T08:00:00Z", "price": 44.90, "currency": "EUR", "source": "Decathlon"},
        {"recorded_at": "2024-01-01T08:00:00Z", "price": 42.90, "currency": "EUR", "source": "Decathlon"},
        {"recorded_at": "2024-02-01T08:00:00Z", "price": 41.50, "currency": "EUR", "source": "Decathlon"},
        {"recorded_at": "2024-03-01T08:00:00Z", "price": 40.99, "currency": "EUR", "source": "Decathlon"},
        {"recorded_at": "2024-04-01T08:00:00Z", "price": 39.99, "currency": "EUR", "source": "Decathlon"},
    ],
    103: [
        {"recorded_at": "2023-11-20T08:00:00Z", "price": 48.90, "currency": "EUR", "source": "Nutrimuscle"},
        {"recorded_at": "2023-12-20T08:00:00Z", "price": 47.90, "currency": "EUR", "source": "Nutrimuscle"},
        {"recorded_at": "2024-01-20T08:00:00Z", "price": 46.90, "currency": "EUR", "source": "Nutrimuscle"},
        {"recorded_at": "2024-02-20T08:00:00Z", "price": 45.90, "currency": "EUR", "source": "Nutrimuscle"},
        {"recorded_at": "2024-03-20T08:00:00Z", "price": 44.90, "currency": "EUR", "source": "Nutrimuscle"},
    ],
    104: [
        {"recorded_at": "2023-12-10T08:00:00Z", "price": 36.99, "currency": "EUR", "source": "Prozis"},
        {"recorded_at": "2024-01-10T08:00:00Z", "price": 35.99, "currency": "EUR", "source": "Prozis"},
        {"recorded_at": "2024-02-10T08:00:00Z", "price": 34.99, "currency": "EUR", "source": "Prozis"},
        {"recorded_at": "2024-03-10T08:00:00Z", "price": 33.50, "currency": "EUR", "source": "Prozis"},
        {"recorded_at": "2024-04-10T08:00:00Z", "price": 32.99, "currency": "EUR", "source": "Prozis"},
    ],
    105: [
        {"recorded_at": "2023-12-05T08:00:00Z", "price": 37.90, "currency": "EUR", "source": "Foodspring"},
        {"recorded_at": "2024-01-05T08:00:00Z", "price": 36.90, "currency": "EUR", "source": "Foodspring"},
        {"recorded_at": "2024-02-05T08:00:00Z", "price": 36.40, "currency": "EUR", "source": "Foodspring"},
        {"recorded_at": "2024-03-05T08:00:00Z", "price": 35.50, "currency": "EUR", "source": "Foodspring"},
        {"recorded_at": "2024-04-05T08:00:00Z", "price": 34.99, "currency": "EUR", "source": "Foodspring"},
    ],
    106: [
        {"recorded_at": "2023-11-30T08:00:00Z", "price": 43.90, "currency": "EUR", "source": "Eric Favre"},
        {"recorded_at": "2023-12-30T08:00:00Z", "price": 42.90, "currency": "EUR", "source": "Eric Favre"},
        {"recorded_at": "2024-01-30T08:00:00Z", "price": 41.90, "currency": "EUR", "source": "Eric Favre"},
        {"recorded_at": "2024-02-29T08:00:00Z", "price": 40.90, "currency": "EUR", "source": "Eric Favre"},
        {"recorded_at": "2024-03-30T08:00:00Z", "price": 39.50, "currency": "EUR", "source": "Eric Favre"},
    ],
}


def get_fallback_products(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Return a clone of the fallback catalogue."""

    products = [deepcopy(product) for product in FALLBACK_PRODUCTS]
    if limit is not None:
        return products[:limit]
    return products


def get_fallback_product(product_id: int) -> Optional[Dict[str, Any]]:
    """Return a fallback product with offers if available."""

    for product in FALLBACK_PRODUCTS:
        try:
            if int(product.get("id")) == int(product_id):
                return deepcopy(product)
        except (TypeError, ValueError):  # pragma: no cover - defensive
            continue
    return None


def get_fallback_price_history(product_id: int) -> List[Dict[str, Any]]:
    """Return price history points for the fallback catalogue."""

    history = FALLBACK_PRICE_HISTORY.get(int(product_id))
    if not history:
        return []
    return [dict(entry) for entry in history]


__all__ = [
    "FALLBACK_PRODUCTS",
    "FALLBACK_PRICE_HISTORY",
    "get_fallback_products",
    "get_fallback_product",
    "get_fallback_price_history",
]
