"""Initial product schema

Revision ID: 001_initial_product_schema
Revises: 
Create Date: 2026-07-27 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial_product_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Categories
    op.create_table('categories',
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
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)

    # Brands
    op.create_table('brands',
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
    op.create_index(op.f('ix_brands_id'), 'brands', ['id'], unique=False)
    op.create_index(op.f('ix_brands_name'), 'brands', ['name'], unique=True)

    # Products
    op.create_table('products',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('barcode', sa.String(length=100), nullable=True),
        sa.Column('hsn_code', sa.String(length=50), nullable=True),
        sa.Column('gst_percentage', sa.Float(), nullable=False),
        sa.Column('purchase_price', sa.Float(), nullable=False),
        sa.Column('selling_price', sa.Float(), nullable=False),
        sa.Column('retail_price', sa.Float(), nullable=False),
        sa.Column('contractor_price', sa.Float(), nullable=False),
        sa.Column('project_price', sa.Float(), nullable=False),
        sa.Column('unit_measure', sa.String(length=20), nullable=False),
        sa.Column('minimum_stock', sa.Float(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['brand_id'], ['brands.id'], ),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_barcode'), 'products', ['barcode'], unique=True)
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_product_code'), 'products', ['product_code'], unique=True)

    # Inventory
    op.create_table('inventory',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('current_stock', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id')
    )
    op.create_index(op.f('ix_inventory_id'), 'inventory', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_inventory_id'), table_name='inventory')
    op.drop_table('inventory')
    op.drop_index(op.f('ix_products_product_code'), table_name='products')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_index(op.f('ix_products_id'), table_name='products')
    op.drop_index(op.f('ix_products_barcode'), table_name='products')
    op.drop_table('products')
    op.drop_index(op.f('ix_brands_name'), table_name='brands')
    op.drop_index(op.f('ix_brands_id'), table_name='brands')
    op.drop_table('brands')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
