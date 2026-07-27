"""Contacts schema

Revision ID: 002_contacts_schema
Revises: 001_initial_product_schema
Create Date: 2026-07-27 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '002_contacts_schema'
down_revision = '001_initial_product_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Customers
    op.create_table('customers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('customer_code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('alternate_phone', sa.String(length=20), nullable=True),
        sa.Column('gst_number', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('credit_limit', sa.Float(), nullable=False),
        sa.Column('outstanding_balance', sa.Float(), nullable=False),
        sa.Column('last_purchase_date', sa.Date(), nullable=True),
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
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)
    op.create_index(op.f('ix_customers_name'), 'customers', ['name'], unique=False)
    op.create_index(op.f('ix_customers_customer_code'), 'customers', ['customer_code'], unique=True)
    op.create_index(op.f('ix_customers_phone'), 'customers', ['phone'], unique=True)
    op.create_index(op.f('ix_customers_gst'), 'customers', ['gst_number'], unique=True)

    # Dealers
    op.create_table('dealers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('dealer_code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('gst_number', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('payment_terms', sa.String(length=100), nullable=True),
        sa.Column('outstanding_balance', sa.Float(), nullable=False),
        sa.Column('last_purchase_date', sa.Date(), nullable=True),
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
    op.create_index(op.f('ix_dealers_id'), 'dealers', ['id'], unique=False)
    op.create_index(op.f('ix_dealers_name'), 'dealers', ['name'], unique=False)
    op.create_index(op.f('ix_dealers_dealer_code'), 'dealers', ['dealer_code'], unique=True)
    op.create_index(op.f('ix_dealers_phone'), 'dealers', ['phone'], unique=True)
    op.create_index(op.f('ix_dealers_gst'), 'dealers', ['gst_number'], unique=True)


def downgrade() -> None:
    op.drop_table('dealers')
    op.drop_table('customers')
