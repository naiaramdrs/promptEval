from sqlmodel import SQLModel, Field


class Credential(SQLModel, table=True):
    id: int = Field(primary_key=True)
    provider: str
    key_encrypted: str
