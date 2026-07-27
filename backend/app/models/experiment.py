from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from app.enums import experiment_status

class Experiment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dataset_id: int = Field(foreign_key="dataset.id")
    evaluation_type: str
    status: experiment_status.ExperimentStatus = Field(default=experiment_status.ExperimentStatus.RUNNING)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
