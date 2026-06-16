from sqlmodel import SQLModel, Field


class Credential(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    provider: str
    key_encrypted: str
