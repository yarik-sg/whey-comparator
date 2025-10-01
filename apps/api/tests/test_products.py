from app.models import Product


def test_create_and_list_products(client):
    response = client.post(
        "/products/",
        json={"name": "Whey Protein", "description": "High quality whey"},
    )
    assert response.status_code == 201
    product = response.json()
    assert product["name"] == "Whey Protein"

    response = client.get("/products/")
    payload = response.json()
    assert payload["total"] == 1
    assert len(payload["items"]) == 1
    assert payload["items"][0]["name"] == "Whey Protein"


def test_filter_products(client, db_session):
    db_session.add_all(
        [
            Product(name="Isolate", description="Pure"),
            Product(name="Concentrate", description="Budget"),
        ]
    )
    db_session.commit()

    response = client.get("/products/?search=Iso")
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Isolate"

    response = client.get("/products/?sort_by=name&sort_order=asc&limit=1")
    data = response.json()
    assert data["items"][0]["name"] == "Concentrate"
