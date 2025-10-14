"""Utilities for scraping gym listings from partner websites."""
from __future__ import annotations

from typing import Dict, List

import requests
from bs4 import BeautifulSoup


def get_basicfit_gyms() -> List[Dict[str, str]]:
    """Return a list of Basic-Fit gyms scraped from the public directory."""
    url = "https://www.basic-fit.com/fr-fr/salles-de-sport"
    response = requests.get(url, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    gyms: List[Dict[str, str]] = []

    for link in soup.select("a.card-location"):
        href = link.get("href")
        name = link.get_text(strip=True)

        if not href or not name:
            continue

        gyms.append(
            {
                "name": name,
                "link": f"https://www.basic-fit.com{href}",
                "brand": "Basic-Fit",
            }
        )

    return gyms
