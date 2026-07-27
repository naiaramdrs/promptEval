from sqlmodel import Session

from app.models.prompt import Prompt
from app.schemas.experiment_schema import ExperimentCreate


def create_prompt(data: ExperimentCreate, experiment_id: int, db: Session):
    prompt_record = Prompt(experiment_id=experiment_id, content=data.prompt_content)

    db.add(prompt_record)
    db.commit()
    db.refresh(prompt_record)

    return prompt_record
