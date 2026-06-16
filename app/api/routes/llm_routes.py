from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.database import get_session
from app.schemas.experiment_schema import ExperimentCreate

from app.services.experiment_service import create_experiment
from app.services.llm_service import create_execution_config, run_experiment
from app.services.deterministic_service import calculate_metrics
from app.services.prompt_service import create_prompt

router = APIRouter()


@router.post("/run")
async def start_experiment(data: ExperimentCreate, db: Session = Depends(get_session)):
    try:
        my_experiment = create_experiment(data, db)
        create_prompt(data, db=db)
        execution_config = create_execution_config(data, db)

        results = await run_experiment(
            dataset_id=data.dataset_id,
            execution_config_id=execution_config.id,
            model_name=data.model_name,
            temperature=data.temperature,
            prompt_content=data.prompt_content,
            credential_id=data.credential_id,
            db=db,
        )

        await calculate_metrics(
            results=results,
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
        raise HTTPException(status_code=500, detail=str(e))
