from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.models import PriceHistory, Product


def test_create_and_list_products(client):
    response = client.post(
        "/products/",
        json={
            "name": "Whey Protein",
            "description": "High quality whey",
            "brand": "MyProtein",
            "category": "whey",
            "price": "24.90",
            "currency": "EUR",
            "rating": "4.5",
            "reviews_count": 120,
        },
    )
    assert response.status_code == 201
    product = response.json()
    assert product["name"] == "Whey Protein"
    assert product["brand"] == "MyProtein"

    response = client.get("/products/")
    payload = response.json()
    assert payload["pagination"]["total"] == 1
    assert len(payload["products"]) == 1
    summary = payload["products"][0]
    assert summary["name"] == "Whey Protein"
    assert summary["bestPrice"]["amount"] == 24.9
    assert summary["bestPrice"]["currency"] == "EUR"


def test_filter_products(client, db_session):
    products = [
        Product(
            name="Isolate",
            description="Pure",
            brand="Nutrimuscle",
            category="isolate",
            price=Decimal("39.90"),
            rating=Decimal("4.8"),
            protein_per_serving_g=Decimal("27"),
        ),
        Product(
            name="Concentrate",
            description="Budget",
            brand="Bulk",
            category="concentrate",
            price=Decimal("24.90"),
            rating=Decimal("4.2"),
            protein_per_serving_g=Decimal("22"),
        ),
    ]
    db_session.add_all(products)
    db_session.commit()

    response = client.get("/products/?search=Iso")
    data = response.json()
    assert data["pagination"]["total"] == 1
    assert data["products"][0]["name"] == "Isolate"

    response = client.get("/products/?sort_by=price_desc")
    data = response.json()
    assert data["products"][0]["name"] == "Isolate"

    response = client.get("/products/?min_price=20&max_price=30")
    data = response.json()
    assert data["pagination"]["total"] == 1
    assert data["products"][0]["name"] == "Concentrate"


def test_price_history_endpoint(client, db_session):
    product = Product(name="Native Whey", price=Decimal("29.90"), currency="EUR")
    db_session.add(product)
    db_session.commit()

    now = datetime.now(timezone.utc)
    history_entries = [
        PriceHistory(
            product_id=product.id,
            price=Decimal("31.90"),
            currency="EUR",
            recorded_at=now - timedelta(days=3),
        ),
        PriceHistory(
            product_id=product.id,
            price=Decimal("28.90"),
            currency="EUR",
            recorded_at=now - timedelta(days=1),
        ),
    ]
    db_session.add_all(history_entries)
    db_session.commit()

    response = client.get(f"/products/{product.id}/price-history?period=7d")
    assert response.status_code == 200
    data = response.json()
    assert data["productId"] == product.id
    assert len(data["points"]) == 2
    assert data["statistics"]["lowest"]["amount"] == 28.9
    assert data["statistics"]["highest"]["amount"] == 31.9


def test_similar_products_endpoint(client, db_session):
    base = Product(
        name="Gold Whey",
        brand="Optimum Nutrition",
        category="whey",
        price=Decimal("34.90"),
        rating=Decimal("4.6"),
    )
    competitor_same_brand = Product(
        name="Gold Whey 2kg",
        brand="Optimum Nutrition",
        category="whey",
        price=Decimal("59.90"),
        rating=Decimal("4.7"),
    )
    competitor_same_category = Product(
        name="Native Whey Premium",
        brand="Nutrimuscle",
        category="whey",
        price=Decimal("39.90"),
        rating=Decimal("4.5"),
    )
    other = Product(
        name="Créatine 500g",
        brand="MyProtein",
        category="creatine",
        price=Decimal("24.90"),
        rating=Decimal("4.8"),
    )

    db_session.add_all([base, competitor_same_brand, competitor_same_category, other])
    db_session.commit()

    response = client.get(f"/products/{base.id}/similar?limit=2")
    assert response.status_code == 200
    payload = response.json()
    assert payload["productId"] == base.id
    assert len(payload["similar"]) == 2
    assert payload["similar"][0]["brand"] == "Optimum Nutrition"


def test_product_reviews_endpoint(client, db_session):
    product = Product(
        name="Isolate Reviews",
        price=Decimal("29.90"),
        currency="EUR",
        rating=Decimal("4.4"),
        reviews_count=230,
    )
    db_session.add(product)
    db_session.commit()

    response = client.get(f"/products/{product.id}/reviews")
    assert response.status_code == 200
    data = response.json()
    assert data["productId"] == product.id
    assert data["averageRating"] == 4.4
    assert data["reviewsCount"] == 230
    assert len(data["distribution"]) == 5
