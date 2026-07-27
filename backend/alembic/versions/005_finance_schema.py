"""Finance schema

Revision ID: 005_finance_schema
Revises: 004_purchases_schema
Create Date: 2026-07-27 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '005_finance_schema'
down_revision = '004_purchases_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Expense Categories
    op.create_table('expense_categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expense_categories_id'), 'expense_categories', ['id'], unique=False)
    op.create_index(op.f('ix_expense_categories_name'), 'expense_categories', ['name'], unique=True)

    # Expenses
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('expense_number', sa.String(length=50), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['expense_categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_expense_number'), 'expenses', ['expense_number'], unique=True)

    # Daily Closings
    op.create_table('daily_closings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('business_date', sa.Date(), nullable=False),
        sa.Column('opening_cash', sa.Float(), nullable=False),
        sa.Column('cash_sales', sa.Float(), nullable=False),
        sa.Column('cash_collections', sa.Float(), nullable=False),
        sa.Column('cash_purchases', sa.Float(), nullable=False),
        sa.Column('cash_expenses', sa.Float(), nullable=False),
        sa.Column('cash_withdrawals', sa.Float(), nullable=False),
        sa.Column('cash_deposits', sa.Float(), nullable=False),
        sa.Column('expected_cash', sa.Float(), nullable=False),
        sa.Column('physical_cash', sa.Float(), nullable=False),
        sa.Column('difference', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_daily_closings_id'), 'daily_closings', ['id'], unique=False)
    op.create_index(op.f('ix_daily_closings_business_date'), 'daily_closings', ['business_date'], unique=True)


def downgrade() -> None:
    op.drop_table('daily_closings')
    op.drop_table('expenses')
    op.drop_table('expense_categories')
