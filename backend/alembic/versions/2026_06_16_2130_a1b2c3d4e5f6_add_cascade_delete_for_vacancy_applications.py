"""Add CASCADE delete for vacancy applications

Revision ID: a1b2c3d4e5f6
Revises: d3315e5e9ed3
Create Date: 2026-06-16 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'd3315e5e9ed3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing foreign key constraint
    op.drop_constraint('applications_vacancy_id_fkey', 'applications', type_='foreignkey')
    
    # Recreate with CASCADE delete
    op.create_foreign_key(
        'applications_vacancy_id_fkey',
        'applications', 'vacancies',
        ['vacancy_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop the CASCADE constraint
    op.drop_constraint('applications_vacancy_id_fkey', 'applications', type_='foreignkey')
    
    # Recreate without CASCADE
    op.create_foreign_key(
        'applications_vacancy_id_fkey',
        'applications', 'vacancies',
        ['vacancy_id'], ['id']
    )
