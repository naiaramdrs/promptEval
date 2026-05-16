from sqlmodel import SQLModel, Field
from typing import List, Optional


class DeterministicMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    model_id: int = Field(foreign_key="model.id")
    is_deterministic: bool
    labels: List[str]
    confusion_matrix: List[List[int]]
    report: str | dict