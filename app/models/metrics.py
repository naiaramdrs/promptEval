from sqlmodel import JSON, Column, SQLModel, Field
from typing import List, Optional


class DeterministicMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    model_id: int = Field(foreign_key="model.id")
    accuracy: float
    labels: List[str] = Field(sa_column=Column(JSON))
    confusion_matrix: List[List[int]] = Field(sa_column=Column(JSON))
    report: str | dict = Field(sa_column=Column(JSON))
