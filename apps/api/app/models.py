from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text())
    brand: Mapped[str | None] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(255), index=True)
    image_url: Mapped[str | None] = mapped_column(String(512))
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="EUR", nullable=False)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2))
    reviews_count: Mapped[int | None] = mapped_column(Integer)
    protein_per_serving_g: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    serving_size_g: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    in_stock: Mapped[bool | None] = mapped_column(Boolean)
    stock_status: Mapped[str | None] = mapped_column(String(255))

    offers: Mapped[list["Offer"]] = relationship(
        "Offer", back_populates="product", cascade="all, delete-orphan"
    )
    scrape_jobs: Mapped[list["ScrapeJob"]] = relationship(
        "ScrapeJob", back_populates="product", cascade="all, delete-orphan"
    )
    price_history: Mapped[list["PriceHistory"]] = relationship(
        "PriceHistory",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="PriceHistory.recorded_at.asc()",
    )
    price_alerts: Mapped[list["PriceAlert"]] = relationship(
        "PriceAlert", back_populates="product", cascade="all, delete-orphan"
    )


class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    website: Mapped[str | None] = mapped_column(String(255))
    contact_email: Mapped[str | None] = mapped_column(String(255))

    offers: Mapped[list["Offer"]] = relationship(
        "Offer", back_populates="supplier", cascade="all, delete-orphan"
    )
    scrape_jobs: Mapped[list["ScrapeJob"]] = relationship(
        "ScrapeJob", back_populates="supplier", cascade="all, delete-orphan"
    )


class Offer(Base, TimestampMixin):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id", ondelete="CASCADE"))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    product: Mapped["Product"] = relationship("Product", back_populates="offers")
    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="offers")
    scrape_jobs: Mapped[list["ScrapeJob"]] = relationship(
        "ScrapeJob", back_populates="offer", cascade="all, delete-orphan"
    )


class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    supplier_id: Mapped[int | None] = mapped_column(
        ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True
    )
    offer_id: Mapped[int | None] = mapped_column(
        ForeignKey("offers.id", ondelete="SET NULL"), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    log: Mapped[str | None] = mapped_column(Text())

    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="scrape_jobs")
    supplier: Mapped[Optional["Supplier"]] = relationship(
        "Supplier", back_populates="scrape_jobs"
    )
    offer: Mapped[Optional["Offer"]] = relationship("Offer", back_populates="scrape_jobs")


class PriceHistory(Base):
    __tablename__ = "price_history"
    __table_args__ = (
        Index("ix_price_history_product_recorded", "product_id", "recorded_at"),
        Index("ix_price_history_platform", "platform"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    platform: Mapped[str | None] = mapped_column(String(100))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR", nullable=False)
    in_stock: Mapped[bool | None] = mapped_column(Boolean, default=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    product: Mapped["Product"] = relationship("Product", back_populates="price_history")


class PriceAlert(Base, TimestampMixin):
    __tablename__ = "price_alerts"
    __table_args__ = (
        UniqueConstraint("user_email", "product_id", "target_price", name="uq_price_alert_unique"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    target_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    platform: Mapped[str | None] = mapped_column(String(100))
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="price_alerts")
