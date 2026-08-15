"""add_documents_table_with_types

Revision ID: 2026_08_15_1200_def678901234
Revises: 2026_06_18_1138_abc123def456
Create Date: 2026-08-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '2026_08_15_1200_def678901234'
down_revision: Union[str, None] = '2026_06_18_1138_abc123def456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create documents table with VARCHAR instead of ENUM
    op.create_table('documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        # Using VARCHAR instead of ENUM for simplicity and flexibility
        sa.Column('doc_type', sa.String(length=50), nullable=False, server_default='guide'),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('role', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('access_level', sa.String(length=50), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('file_name', sa.String(length=200), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('content_text', sa.Text(), nullable=True),
        sa.Column('author_id', sa.Integer(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('published_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
    op.create_index(op.f('ix_documents_title'), 'documents', ['title'], unique=False)
    op.create_index(op.f('ix_documents_department'), 'documents', ['department'], unique=False)
    op.create_index(op.f('ix_documents_role'), 'documents', ['role'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_documents_role'), table_name='documents')
    op.drop_index(op.f('ix_documents_department'), table_name='documents')
    op.drop_index(op.f('ix_documents_title'), table_name='documents')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    
    # Drop table
    op.drop_table('documents')
    
    # Drop enums
    op.execute("DROP TYPE document_status")
    op.execute("DROP TYPE document_type")
