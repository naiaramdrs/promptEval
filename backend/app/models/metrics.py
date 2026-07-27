from sqlmodel import JSON, Column, SQLModel, Field
from typing import Optional


class Metrics(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    execution_config_id: int = Field(foreign_key="executionconfig.id", ondelete="CASCADE")
    metric_type: str
    details_json: dict = Field(sa_column=Column(JSON))
