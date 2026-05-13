from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    dataset_id: int
    provider: str
    model_id: str
    temperature: float = 0.0
    prompt: str
