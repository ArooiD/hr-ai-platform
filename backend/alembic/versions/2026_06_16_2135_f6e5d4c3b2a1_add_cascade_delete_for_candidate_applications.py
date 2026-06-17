"""Add CASCADE delete for candidate applications

Revision ID: f6e5d4c3b2a1
Revises: a1b2c3d4e5f6
Create Date: 2026-06-16 21:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6e5d4c3b2a1'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing foreign key constraint for candidate_id
    op.drop_constraint('applications_candidate_id_fkey', 'applications', type_='foreignkey')
    
    # Recreate with CASCADE delete
    op.create_foreign_key(
        'applications_candidate_id_fkey',
        'applications', 'candidates',
        ['candidate_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop the CASCADE constraint
    op.drop_constraint('applications_candidate_id_fkey', 'applications', type_='foreignkey')
    
    # Recreate without CASCADE
    op.create_foreign_key(
        'applications_candidate_id_fkey',
        'applications', 'candidates',
        ['candidate_id'], ['id']
    )
