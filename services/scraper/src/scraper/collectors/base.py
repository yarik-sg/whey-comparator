from __future__ import annotations

import abc
from typing import Any

from ..normalization.product import NormalizedProduct, normalize_product


class Collector(abc.ABC):
    name: str

    @abc.abstractmethod
    async def collect(self) -> list[NormalizedProduct]:
        raise NotImplementedError

    async def normalize(self, raw_products: list[dict[str, Any]]) -> list[NormalizedProduct]:
        return [normalize_product(raw) for raw in raw_products]
