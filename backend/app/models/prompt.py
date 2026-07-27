from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


class Prompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    experiment_id: int = Field(foreign_key="experiment.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
