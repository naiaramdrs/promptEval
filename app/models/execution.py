from sqlmodel import SQLModel, Field


class ExecutionResult(SQLModel, table=True):
    id: int = Field(primary_key=True)
    testcase_id: int = Field(foreign_key="testcase.id")
    model_id: int = Field(foreign_key="model.id")
    model_response: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
