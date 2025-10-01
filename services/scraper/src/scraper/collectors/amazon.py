from __future__ import annotations

from typing import Any

import httpx
from parsel import Selector

from .base import Collector


class AmazonCollector(Collector):
    name = "amazon"
    search_url = "https://www.amazon.fr/s?k=whey+protein"

    async def collect(self) -> list:
        async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0"}) as client:
            response = await client.get(self.search_url)
            response.raise_for_status()

        selector = Selector(response.text)
        raw_products: list[dict[str, Any]] = []

        for result in selector.css("div.s-result-item")[:10]:
            title = result.css("h2 a span::text").get()
            link = result.css("h2 a::attr(href)").get()
            price_whole = result.css("span.a-price-whole::text").get()
            price_fraction = result.css("span.a-price-fraction::text").get()

            if not title or not link or not price_whole:
                continue

            price = float(price_whole.replace("\xa0", "").replace(",", "."))
            if price_fraction:
                price += float(price_fraction) / 100

            raw_products.append(
                {
                    "name": title.strip(),
                    "brand": None,
                    "offers": [
                        {
                            "source": self.name,
                            "url": f"https://www.amazon.fr{link}",
                            "price": price,
                            "currency": "EUR",
                        }
                    ],
                }
            )

        return await self.normalize(raw_products)
