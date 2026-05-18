from pydantic import BaseModel
from typing import List


class DeterministicMetricsResponse(BaseModel):
    id: int
    model_id: int
    accuracy: float
    labels: List[str]
    confusion_matrix: List[List[int]]
    report: str | dict

    class Config:
        from_attributes = True
