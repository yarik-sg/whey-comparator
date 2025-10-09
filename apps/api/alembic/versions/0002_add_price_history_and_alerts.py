"""add price history and alerts tables

Revision ID: 0002_add_price_history_and_alerts
Revises: 0001_create_core_tables
Create Date: 2024-05-20 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_add_price_history_and_alerts"
down_revision: Union[str, None] = "0001_create_core_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("brand", sa.String(length=255), nullable=True))
    op.add_column(
        "products",
        sa.Column("category", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("image_url", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("currency", sa.String(length=3), server_default="EUR", nullable=False),
    )
    op.add_column(
        "products",
        sa.Column("rating", sa.Numeric(3, 2), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("reviews_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("protein_per_serving_g", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("serving_size_g", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column("products", sa.Column("in_stock", sa.Boolean(), nullable=True))
    op.add_column(
        "products",
        sa.Column("stock_status", sa.String(length=255), nullable=True),
    )
    op.create_index(
        "ix_products_category",
        "products",
        ["category"],
        unique=False,
    )

    op.create_table(
        "price_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("platform", sa.String(length=100), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="EUR", nullable=False),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_price_history_product_recorded",
        "price_history",
        ["product_id", "recorded_at"],
        unique=False,
    )

    op.create_table(
        "price_alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_email", sa.String(length=255), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("target_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("platform", sa.String(length=100), nullable=True),
        sa.Column("active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_email", "product_id", "target_price", name="uq_price_alert_unique"),
    )


def downgrade() -> None:
    op.drop_table("price_alerts")
    op.drop_index("ix_price_history_product_recorded", table_name="price_history")
    op.drop_table("price_history")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_column("products", "stock_status")
    op.drop_column("products", "in_stock")
    op.drop_column("products", "serving_size_g")
    op.drop_column("products", "protein_per_serving_g")
    op.drop_column("products", "reviews_count")
    op.drop_column("products", "rating")
    op.drop_column("products", "currency")
    op.drop_column("products", "price")
    op.drop_column("products", "image_url")
    op.drop_column("products", "category")
    op.drop_column("products", "brand")
