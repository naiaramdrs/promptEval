from sqlmodel import SQLModel, Field
from typing import Optional


class Dataset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    format: str
    number_lines: int


class TestCase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    dataset_id: int = Field(foreign_key="dataset.id")
    query: str
    expected_answer: str
