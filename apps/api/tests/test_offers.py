from decimal import Decimal

from app.models import Offer, Product, Supplier


def seed_product_supplier(db_session):
    product = Product(name="Isolate")
    supplier = Supplier(name="GymShop")
    db_session.add_all([product, supplier])
    db_session.commit()
    db_session.refresh(product)
    db_session.refresh(supplier)
    return product, supplier


def test_create_offer_and_filter(client, db_session):
    product, supplier = seed_product_supplier(db_session)

    response = client.post(
        "/offers/",
        json={
            "product_id": product.id,
            "supplier_id": supplier.id,
            "price": "29.99",
            "currency": "EUR",
            "url": "https://example.com/offer",
            "available": True,
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["price"] == "29.99"

    response = client.get(f"/offers/?product_id={product.id}&min_price=20&max_price=30")
    data = response.json()
    assert data["total"] == 1
    assert Decimal(data["items"][0]["price"]) == Decimal("29.99")

    response = client.get("/offers/?sort_by=price&sort_order=asc")
    assert response.status_code == 200


def test_offer_update(client, db_session):
    product, supplier = seed_product_supplier(db_session)
    offer = Offer(
        product_id=product.id,
        supplier_id=supplier.id,
        price=Decimal("19.99"),
        currency="EUR",
        url="https://example.com",
    )
    db_session.add(offer)
    db_session.commit()
    db_session.refresh(offer)

    response = client.put(
        f"/offers/{offer.id}",
        json={"price": "21.50", "available": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["price"] == "21.50"
    assert data["available"] is False
