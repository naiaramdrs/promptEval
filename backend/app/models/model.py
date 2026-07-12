from typing import Optional

from sqlmodel import SQLModel, Field


class Model(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    provider: str
    temperature: float = 0.0
    prompt: str = ""
