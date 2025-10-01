from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
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

    offers: Mapped[list["Offer"]] = relationship(
        "Offer", back_populates="product", cascade="all, delete-orphan"
    )
    scrape_jobs: Mapped[list["ScrapeJob"]] = relationship(
        "ScrapeJob", back_populates="product", cascade="all, delete-orphan"
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

    product: Mapped["Product" | None] = relationship("Product", back_populates="scrape_jobs")
    supplier: Mapped["Supplier" | None] = relationship(
        "Supplier", back_populates="scrape_jobs"
    )
    offer: Mapped["Offer" | None] = relationship("Offer", back_populates="scrape_jobs")
