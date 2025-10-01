from __future__ import annotations

from typing import Any

from playwright.async_api import async_playwright

from .base import Collector


class MyProteinCollector(Collector):
    name = "myprotein"

    async def collect(self) -> list:
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            page = await browser.new_page()
            await page.goto("https://www.myprotein.fr/nutrition-sportive/proteines.list")
            await page.wait_for_timeout(2000)

            products = await page.evaluate(
                """
                () => {
                    return Array.from(document.querySelectorAll('[data-component="product-card"]')).map(card => ({
                        name: card.querySelector('[data-testid="product-card-name"]').innerText.trim(),
                        brand: 'MyProtein',
                        offers: [{
                            source: 'myprotein',
                            url: card.querySelector('a').href,
                            price: parseFloat(card.querySelector('[data-testid="product-card-price"]').innerText.replace(/[^0-9,.]/g, '').replace(',', '.')),
                            currency: 'EUR'
                        }]
                    }));
                }
                """
            )
            await browser.close()

        raw_products: list[dict[str, Any]] = products or []
        return await self.normalize(raw_products)
