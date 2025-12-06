"""Add video_consultations table

Revision ID: add_video_consultations
Revises: 
Create Date: 2025-11-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_video_consultations'
down_revision = None  # Update this to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create video_consultations table
    op.create_table(
        'video_consultations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('consultation_id', sa.String(length=50), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('meeting_url', sa.String(length=500), nullable=True),
        sa.Column('meeting_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.Enum('scheduled', 'in_progress', 'completed', 'cancelled', name='consultationstatus'), nullable=False),
        sa.Column('scheduled_time', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
    )
    op.create_index(op.f('ix_video_consultations_id'), 'video_consultations', ['id'], unique=False)
    op.create_index(op.f('ix_video_consultations_consultation_id'), 'video_consultations', ['consultation_id'], unique=True)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_video_consultations_consultation_id'), table_name='video_consultations')
    op.drop_index(op.f('ix_video_consultations_id'), table_name='video_consultations')
    
    # Drop table
    op.drop_table('video_consultations')
