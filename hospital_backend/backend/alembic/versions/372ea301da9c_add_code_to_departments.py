"""add_code_to_departments

Revision ID: 372ea301da9c
Revises: add_video_consultations
Create Date: 2025-12-02 13:08:38.200476

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '372ea301da9c'
down_revision = 'add_video_consultations'
branch_labels = None
depends_on = None


def upgrade():
    # Add code column to departments table
    op.add_column('departments', sa.Column('code', sa.String(length=20), nullable=True))
    
    # Update existing records with temporary codes
    op.execute("UPDATE departments SET code = CONCAT('DEPT', LPAD(id, 3, '0')) WHERE code IS NULL")
    
    # Make code column non-nullable and unique
    op.alter_column('departments', 'code', nullable=False)
    op.create_unique_constraint('uq_departments_code', 'departments', ['code'])
    op.create_index('ix_departments_code', 'departments', ['code'])


def downgrade():
    # Remove code column
    op.drop_index('ix_departments_code', table_name='departments')
    op.drop_constraint('uq_departments_code', 'departments', type_='unique')
    op.drop_column('departments', 'code')
