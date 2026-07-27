from sqlmodel import Session, select

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


def get_experiment(experiment_id: int, db: Session):
    experiment = db.get(Experiment, experiment_id)
    return experiment


def list_experiments(db: Session):
    return db.exec(select(Experiment)).all()


def delete_experiment(experiment_id: int, db: Session):
    experiment = db.get(Experiment, experiment_id)
    if experiment:
        db.delete(experiment)
        db.commit()
        return True
    return False


def update_experiment(
    experiment_id: int, name: str, dataset_id: int, evaluation_type: str, db: Session
):
    experiment = get_experiment(experiment_id, db)
    if experiment:
        experiment.name = name
        experiment.dataset_id = dataset_id
        experiment.evaluation_type = evaluation_type
        db.add(experiment)
        db.commit()
        db.refresh(experiment)
        return experiment
    return None
