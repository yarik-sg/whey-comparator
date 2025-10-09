from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import offers, price_alerts, products, suppliers

app = FastAPI(title="Whey Comparator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
app.include_router(offers.router, prefix="/offers", tags=["offers"])
app.include_router(price_alerts.router, prefix="/price-alerts", tags=["price-alerts"])


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
