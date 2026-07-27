from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


class ExecutionConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    experiment_id: int = Field(foreign_key="experiment.id", ondelete="CASCADE")
    credential_id: int = Field(foreign_key="credential.id")
    prompt_id: int = Field(foreign_key="prompt.id")
    model_name: str
    temperature: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ExecutionResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    testcase_id: int = Field(foreign_key="testcase.id")
    execution_config_id: int = Field(
        foreign_key="executionconfig.id", ondelete="CASCADE"
    )
    model_response: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    execution_time_ms: int
