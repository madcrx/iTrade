"""Initial schema — users, signals, watchlist, portfolio, backtest, strategies

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column("settings", sa.JSON(), nullable=True),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"])

    # ── strategies ─────────────────────────────────────────────────────────────
    op.create_table(
        "strategies",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("display_name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("asset_classes", sa.JSON(), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("default_stop_loss_pct", sa.Float(), nullable=False, server_default="2.0"),
        sa.Column("default_take_profit_pct", sa.Float(), nullable=False, server_default="4.0"),
        sa.Column("parameters", sa.JSON(), nullable=True),
        sa.Column("stats", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_strategies_id", "strategies", ["id"])
    op.create_index("ix_strategies_name", "strategies", ["name"])

    # ── watchlist_items ────────────────────────────────────────────────────────
    op.create_table(
        "watchlist_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("asset_type", sa.String(20), nullable=False, server_default="stock"),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column(
            "added_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_watchlist_items_id", "watchlist_items", ["id"])
    op.create_index("ix_watchlist_items_user_id", "watchlist_items", ["user_id"])

    # ── signals ────────────────────────────────────────────────────────────────
    op.create_table(
        "signals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("strategy", sa.String(100), nullable=False),
        sa.Column("action", sa.String(10), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("reasoning", sa.String(2000), nullable=False),
        sa.Column("indicator_values", sa.JSON(), nullable=True),
        sa.Column("stop_loss", sa.Float(), nullable=True),
        sa.Column("take_profit", sa.Float(), nullable=True),
        sa.Column("stop_loss_pct", sa.Float(), nullable=True),
        sa.Column("take_profit_pct", sa.Float(), nullable=True),
        sa.Column("acted_on", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            index=True,
        ),
    )
    op.create_index("ix_signals_id", "signals", ["id"])
    op.create_index("ix_signals_user_id", "signals", ["user_id"])
    op.create_index("ix_signals_symbol", "signals", ["symbol"])
    op.create_index("ix_signals_created_at", "signals", ["created_at"])

    # ── portfolio_trades ───────────────────────────────────────────────────────
    op.create_table(
        "portfolio_trades",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("action", sa.String(10), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("trade_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "signal_id",
            sa.Integer(),
            sa.ForeignKey("signals.id"),
            nullable=True,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("broker", sa.String(50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_portfolio_trades_id", "portfolio_trades", ["id"])
    op.create_index("ix_portfolio_trades_user_id", "portfolio_trades", ["user_id"])
    op.create_index("ix_portfolio_trades_symbol", "portfolio_trades", ["symbol"])

    # ── backtest_results ───────────────────────────────────────────────────────
    op.create_table(
        "backtest_results",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("strategy", sa.String(100), nullable=False),
        sa.Column("period", sa.String(20), nullable=False),
        sa.Column("results", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_backtest_results_id", "backtest_results", ["id"])
    op.create_index("ix_backtest_results_user_id", "backtest_results", ["user_id"])


def downgrade() -> None:
    op.drop_table("backtest_results")
    op.drop_table("portfolio_trades")
    op.drop_table("signals")
    op.drop_table("watchlist_items")
    op.drop_table("strategies")
    op.drop_table("users")
