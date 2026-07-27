from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


class Dataset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    format_name: str
    number_lines: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TestCase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    dataset_id: int = Field(foreign_key="dataset.id", ondelete="cascade")
    query: str
    context: str
    expected_answer: str
