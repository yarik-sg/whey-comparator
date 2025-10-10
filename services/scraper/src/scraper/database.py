from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Float,
    Numeric,
    String,
    func,
)
from sqlalchemy.ext.asyncio import (
    AsyncAttrs,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from .settings import settings


class Base(AsyncAttrs, DeclarativeBase):
    pass


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(length=255))
    flavour: Mapped[str | None] = mapped_column(String(length=255))
    protein_per_serving_g: Mapped[float | None] = mapped_column(Float)
    serving_size_g: Mapped[float | None] = mapped_column(Float)
    image: Mapped[str | None] = mapped_column(String(length=1024))
    image_url: Mapped[str | None] = mapped_column(String(length=1024))
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    offers: Mapped[list["Offer"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    price_history: Mapped[list["PriceHistory"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    source: Mapped[str] = mapped_column(String(length=255), nullable=False)
    url: Mapped[str] = mapped_column(String(length=1024), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(length=8), default="EUR")
    price_per_100g_protein: Mapped[float | None] = mapped_column(Float)
    stock_status: Mapped[str | None] = mapped_column(String(length=64))
    in_stock: Mapped[bool | None] = mapped_column(Boolean, default=None)
    shipping_cost: Mapped[float | None] = mapped_column(Float)
    shipping_text: Mapped[str | None] = mapped_column(String(length=255))
    image: Mapped[str | None] = mapped_column(String(length=1024))
    last_checked: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    product: Mapped[Product] = relationship(back_populates="offers")


class PriceHistory(Base):
    __tablename__ = "price_history"
    __table_args__ = (
        Index("ix_price_history_product_recorded", "product_id", "recorded_at"),
        Index("ix_price_history_platform", "platform"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(String(length=64), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(length=3), default="EUR")
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    recorded_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    product: Mapped[Product] = relationship(back_populates="price_history")


engine: AsyncEngine = create_async_engine(settings.database_url, echo=False, future=True)
SessionMaker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_models() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionMaker() as session:
        yield session
