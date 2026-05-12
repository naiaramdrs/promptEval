from sqlmodel import SQLModel, Field
from typing import Optional

class Model(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    provider: str
    temperature: Optional[float] = None