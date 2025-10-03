from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class NormalizedOffer:
    source: str
    url: str
    price: float
    currency: str
    stock_status: str | None = None
    in_stock: bool | None = None
    shipping_cost: float | None = None
    shipping_text: str | None = None
    protein_content_g: float | None = None
    price_per_100g_protein: float | None = None

    def compute_metrics(self, protein_per_serving: float | None) -> None:
        if self.protein_content_g:
            protein_quantity = self.protein_content_g
        else:
            protein_quantity = protein_per_serving

        if protein_quantity and protein_quantity > 0:
            self.price_per_100g_protein = round(self.price / protein_quantity * 100, 2)
        else:
            self.price_per_100g_protein = None


@dataclass(slots=True)
class NormalizedProduct:
    name: str
    brand: str | None = None
    flavour: str | None = None
    protein_per_serving_g: float | None = None
    serving_size_g: float | None = None
    offers: list[NormalizedOffer] = field(default_factory=list)

    def compute_metrics(self) -> None:
        for offer in self.offers:
            offer.compute_metrics(self.protein_per_serving_g)


def normalize_product(raw: dict) -> NormalizedProduct:
    product = NormalizedProduct(
        name=raw.get("name", ""),
        brand=raw.get("brand"),
        flavour=raw.get("flavour"),
        protein_per_serving_g=raw.get("protein_per_serving_g"),
        serving_size_g=raw.get("serving_size_g"),
        offers=[NormalizedOffer(**offer) for offer in raw.get("offers", [])],
    )

    product.compute_metrics()
    return product
