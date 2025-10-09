from decimal import Decimal

import pytest

from app.models import Product


def test_create_price_alert(client, db_session):
    product = Product(name="Test Product", price=Decimal("19.90"), currency="EUR")
    db_session.add(product)
    db_session.commit()

    payload = {
        "user_email": "jane@example.com",
        "product_id": product.id,
        "target_price": "18.50",
    }

    response = client.post("/price-alerts/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user_email"] == "jane@example.com"
    assert data["active"] is True

    response = client.get(f"/price-alerts/?product_id={product.id}")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) == 1
    assert float(alerts[0]["target_price"]) == pytest.approx(18.5)

    duplicate = client.post("/price-alerts/", json=payload)
    assert duplicate.status_code == 400
