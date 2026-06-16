from typing import Optional

from pydantic import Field
from sqlmodel import SQLModel


class Experiment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dataset_id: int = Field(foreign_key="dataset.id")
    evaluation_type: str
    created_at: Optional[str] = None