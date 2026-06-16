from pydantic import Field
from sqlmodel import SQLModel


class Prompt(SQLModel, table=True):
    id: int = Field(primary_key=True)
    content: str
    experiment_id: int = Field(foreign_key="experiment.id")
    