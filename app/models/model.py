from sqlmodel import SQLModel, Field


class Model(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    provider: str
    temperature: float = 0.0
    prompt: str = ""
