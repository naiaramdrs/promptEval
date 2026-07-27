import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.database import get_session
from app.schemas.experiment_schema import ExperimentCreate

from app.services.experiment_service import (
    create_experiment,
    list_experiments,
    get_experiment,
    delete_experiment,
)
from app.services.llm_service import create_execution_config, run_experiment
from app.services.metrics_service import calculate_deterministic_metrics
from app.services.prompt_service import create_prompt
from app.enums.experiment_status import ExperimentStatus

router = APIRouter()


@router.post("/run")
async def start_experiment(data: ExperimentCreate, db: Session = Depends(get_session)):
    my_experiment = None

    try:
        my_experiment = create_experiment(data, db)
        prompt = create_prompt(data, my_experiment.id, db=db)
        execution_config = create_execution_config(data, my_experiment.id, prompt.id, db=db)

        results = await run_experiment(
            dataset_id=data.dataset_id,
            execution_config_id=execution_config.id,
            model_name=data.model_name,
            temperature=data.temperature,
            prompt=data.prompt_content,
            credential_id=data.credential_id,
            db=db,
        )

        await calculate_deterministic_metrics(
            results=results,
            execution_config_id=execution_config.id,
            db=db,
        )

        my_experiment.status = ExperimentStatus.COMPLETED
        db.add(my_experiment)
        db.commit()

        return {
            "message": "Experimento concluído com sucesso!",
            "experiment_id": my_experiment.id,
            "execution_config_id": execution_config.id,
            "total_processed": len(results),
            "code": 200,
            "status": my_experiment.status.value,
        }

    except Exception as e:
        db.rollback()

        if my_experiment:
            my_experiment.status = ExperimentStatus.FAILED
            db.add(my_experiment)
            db.commit()

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/experiments")
def list_all_experiments(db: Session = Depends(get_session)):
    return list_experiments(db)


@router.get("/experiments/{experiment_id}")
def get_experiment_by_id(experiment_id: int, db: Session = Depends(get_session)):
    experiment = get_experiment(experiment_id, db)
    if experiment:
        return experiment
    return {"message": "Experimento não encontrado", "code": 404}


@router.delete("/experiments/{experiment_id}")
def delete_experiment_by_id(experiment_id: int, db: Session = Depends(get_session)):
    success = delete_experiment(experiment_id, db)
    if success:
        return {"message": "Experimento deletado com sucesso", "code": 200}
    return {"message": "Experimento não encontrado", "code": 404}
