from typing import Optional

from sqlmodel import SQLModel, Field


class Credential(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    provider: str
    key_encrypted: str
