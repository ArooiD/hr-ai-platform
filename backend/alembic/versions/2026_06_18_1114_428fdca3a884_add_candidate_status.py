"""add_candidate_status

Revision ID: 428fdca3a884
Revises: f6e5d4c3b2a1
Create Date: 2026-06-18 11:14:11.740908

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '428fdca3a884'
down_revision: Union[str, Sequence[str], None] = 'f6e5d4c3b2a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Создаем enum тип для статуса кандидата
    candidate_status_enum = sa.Enum('active', 'reserve', 'hired', name='candidatestatus')
    candidate_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Добавляем колонку status в таблицу candidates с дефолтным значением 'active'
    op.add_column('candidates', sa.Column('status', candidate_status_enum, nullable=True, default='active'))
    
    # Устанавливаем дефолтное значение для существующих записей
    op.execute("UPDATE candidates SET status = 'active' WHERE status IS NULL")
    
    # Делаем колонку not null
    op.alter_column('candidates', 'status', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Удаляем колонку
    op.drop_column('candidates', 'status')
    
    # Удаляем enum тип
    candidate_status_enum = sa.Enum('active', 'reserve', 'hired', name='candidatestatus')
    candidate_status_enum.drop(op.get_bind(), checkfirst=True)
