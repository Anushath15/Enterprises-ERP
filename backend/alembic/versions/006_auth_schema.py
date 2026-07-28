"""Auth schema

Revision ID: 006_auth_schema
Revises: 005_finance_schema
Create Date: 2026-07-27 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
import datetime
from app.security.password import get_password_hash
from app.security.permissions import Role


revision = '006_auth_schema'
down_revision = '005_finance_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    users_table = op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('updated_by', sa.String(length=255), nullable=True),
        sa.Column('deleted_by', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Seed default admin user
    op.bulk_insert(users_table,
        [
            {
                'username': 'admin',
                'hashed_password': get_password_hash('admin123'),
                'role': Role.ADMIN.value,
                'is_active': True,
                'created_at': datetime.datetime.now(datetime.timezone.utc),
                'updated_at': datetime.datetime.now(datetime.timezone.utc)
            }
        ]
    )

def downgrade() -> None:
    op.drop_table('users')
