from sqlmodel import Session

from app.models.experiment import Experiment
from app.schemas.experiment_schema import ExperimentCreate


def create_experiment(data: ExperimentCreate, db: Session):
    my_experiment = Experiment(
        dataset_id=data.dataset_id, name=data.name, evaluation_type=data.evaluation_type
    )

    db.add(my_experiment)
    db.commit()
    db.refresh(my_experiment)

    return my_experiment
