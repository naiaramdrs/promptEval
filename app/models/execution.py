from sqlmodel import SQLModel, Field
from typing import Optional

class ExecutionResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    testcase_id: int = Field(foreign_key="testcase.id")
    model_id: int = Field(foreign_key="model.id")
    model_response: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int