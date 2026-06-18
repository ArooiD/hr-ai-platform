"""add users table and vacancy visibility

Revision ID: 2026_06_18_1138_abc123def456
Revises: 428fdca3a884
Create Date: 2026-06-18 11:38:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2026_06_18_1138_abc123def456'
down_revision: Union[str, None] = '428fdca3a884'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types (if not exists)
    try:
        UserRole = sa.Enum('regular', 'specialist', 'admin', name='userrole')
        UserRole.create(op.get_bind(), checkfirst=True)
    except Exception:
        pass  # Type already exists
    
    try:
        VacancyVisibility = sa.Enum('public', 'specialist', 'internal', name='vacancyvisibility')
        VacancyVisibility.create(op.get_bind(), checkfirst=True)
    except Exception:
        pass  # Type already exists
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('login', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('role', sa.Enum('regular', 'specialist', 'admin', name='userrole'), default='regular'),
        sa.Column('specialties', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('login'),
        sa.UniqueConstraint('email')
    )
    
    # Create index on login
    op.create_index('ix_users_login', 'users', ['login'])
    
    # Add visibility and required_specialty columns to vacancies
    op.add_column('vacancies', sa.Column('visibility', sa.Enum('public', 'specialist', 'internal', name='vacancyvisibility'), default='public'))
    op.add_column('vacancies', sa.Column('required_specialty', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove columns from vacancies
    op.drop_column('vacancies', 'required_specialty')
    op.drop_column('vacancies', 'visibility')
    
    # Drop users table
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS vacancyvisibility')
    op.execute('DROP TYPE IF EXISTS userrole')
