"""Purchases schema

Revision ID: 004_purchases_schema
Revises: 003_sales_schema
Create Date: 2026-07-27 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '004_purchases_schema'
down_revision = '003_sales_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Purchase Invoices
    op.create_table('purchase_invoices',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('purchase_number', sa.String(length=50), nullable=False),
        sa.Column('dealer_id', sa.Integer(), nullable=False),
        sa.Column('subtotal', sa.Float(), nullable=False),
        sa.Column('discount', sa.Float(), nullable=False),
        sa.Column('tax_total', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('payment_type', sa.String(length=50), nullable=False),
        sa.Column('payment_status', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['dealer_id'], ['dealers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_purchase_invoices_id'), 'purchase_invoices', ['id'], unique=False)
    op.create_index(op.f('ix_purchase_invoices_purchase_number'), 'purchase_invoices', ['purchase_number'], unique=True)
    op.create_index(op.f('ix_purchase_invoices_dealer_id'), 'purchase_invoices', ['dealer_id'], unique=False)

    # Purchase Items
    op.create_table('purchase_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('subtotal', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['invoice_id'], ['purchase_invoices.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_purchase_items_invoice_id'), 'purchase_items', ['invoice_id'], unique=False)
    op.create_index(op.f('ix_purchase_items_product_id'), 'purchase_items', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_table('purchase_items')
    op.drop_table('purchase_invoices')
