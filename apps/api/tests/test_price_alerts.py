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
    assert data["product"]["name"] == "Test Product"

    response = client.get(f"/price-alerts/?product_id={product.id}")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) == 1
    assert float(alerts[0]["target_price"]) == pytest.approx(18.5)
    assert alerts[0]["product"]["id"] == product.id

    duplicate = client.post("/price-alerts/", json=payload)
    assert duplicate.status_code == 400


def test_update_and_delete_price_alert(client, db_session):
    product = Product(name="Another Product", price=Decimal("29.90"), currency="EUR")
    db_session.add(product)
    db_session.commit()

    payload = {
        "user_email": "user@example.com",
        "product_id": product.id,
        "target_price": "25.00",
    }

    create_response = client.post("/price-alerts/", json=payload)
    assert create_response.status_code == 201
    alert_id = create_response.json()["id"]

    update_response = client.patch(f"/price-alerts/{alert_id}", json={"active": False})
    assert update_response.status_code == 200
    assert update_response.json()["active"] is False

    delete_response = client.delete(f"/price-alerts/{alert_id}")
    assert delete_response.status_code == 204

    not_found = client.get(f"/price-alerts/?product_id={product.id}")
    assert not_found.json() == []
