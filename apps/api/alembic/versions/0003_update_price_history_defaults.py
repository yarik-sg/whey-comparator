"""ensure price history defaults"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_update_price_history_defaults"
down_revision: Union[str, None] = "0002_add_price_history_and_alerts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    table_names = inspector.get_table_names()
    if "price_history" not in table_names:
        op.create_table(
            "price_history",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("platform", sa.String(length=50), nullable=True),
            sa.Column("price", sa.Numeric(10, 2), nullable=False),
            sa.Column(
                "recorded_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
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
        return

    existing_indexes = {
        index["name"] for index in inspector.get_indexes("price_history")
    }
    if "ix_price_history_product_recorded" not in existing_indexes:
        op.create_index(
            "ix_price_history_product_recorded",
            "price_history",
            ["product_id", "recorded_at"],
            unique=False,
        )

    op.alter_column(
        "price_history",
        "platform",
        type_=sa.String(length=50),
        existing_type=sa.String(length=100),
        existing_nullable=True,
    )

    op.alter_column(
        "price_history",
        "recorded_at",
        server_default=sa.text("CURRENT_TIMESTAMP"),
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    table_names = inspector.get_table_names()
    if "price_history" not in table_names:
        return

    op.alter_column(
        "price_history",
        "platform",
        type_=sa.String(length=100),
        existing_type=sa.String(length=50),
        existing_nullable=True,
    )

    op.alter_column(
        "price_history",
        "recorded_at",
        server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"),
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
    )
