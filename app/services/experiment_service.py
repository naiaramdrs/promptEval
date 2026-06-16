from sqlmodel import Session

from app.models.experiment import Experiment
from app.schemas.experiment_schema import ExperimentCreate


def create_experiment(data: ExperimentCreate, db: Session):
    experiment = Experiment(
        dataset_id=data.dataset_id, name=data.name, evaluation_type=data.evaluation_type
    )

    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    return experiment
