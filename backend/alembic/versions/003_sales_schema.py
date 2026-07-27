"""Sales schema

Revision ID: 003_sales_schema
Revises: 002_contacts_schema
Create Date: 2026-07-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '003_sales_schema'
down_revision = '002_contacts_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Sales Invoices
    op.create_table('sales_invoices',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('invoice_number', sa.String(length=50), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_invoices_id'), 'sales_invoices', ['id'], unique=False)
    op.create_index(op.f('ix_sales_invoices_invoice_number'), 'sales_invoices', ['invoice_number'], unique=True)
    op.create_index(op.f('ix_sales_invoices_customer_id'), 'sales_invoices', ['customer_id'], unique=False)

    # Sales Items
    op.create_table('sales_items',
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
        sa.ForeignKeyConstraint(['invoice_id'], ['sales_invoices.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_items_invoice_id'), 'sales_items', ['invoice_id'], unique=False)
    op.create_index(op.f('ix_sales_items_product_id'), 'sales_items', ['product_id'], unique=False)

    # Inventory Movements
    op.create_table('inventory_movements',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(length=50), nullable=False),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('quantity_change', sa.Float(), nullable=False),
        sa.Column('resulting_stock', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['reference_id'], ['sales_invoices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_movements_product_id'), 'inventory_movements', ['product_id'], unique=False)

    # Audit Logs
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('inventory_movements')
    op.drop_table('sales_items')
    op.drop_table('sales_invoices')
