from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    dataset_id: int
    name: str
    evaluation_type: str
    prompt_content: str
    credential_id: int
    model_name: str
    temperature: float
