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

router = APIRouter()


@router.post("/run")
async def start_experiment(data: ExperimentCreate, db: Session = Depends(get_session)):
    try:
        my_experiment = create_experiment(data, db)
        prompt = create_prompt(data, my_experiment.id, db=db)
        execution_config = create_execution_config(
            data, my_experiment.id, prompt.id, db=db
        )

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

        return {
            "message": "Experimento concluído com sucesso!",
            "experiment_id": my_experiment.id,
            "execution_config_id": execution_config.id,
            "total_processed": len(results),
        }

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        print(e)
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
