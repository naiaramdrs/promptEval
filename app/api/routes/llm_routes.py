from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.database import get_session
from app.schemas.experiment import ExperimentCreate
from app.services.llm_service import run_experiment

router = APIRouter()


@router.post("/run")
async def start_experiment(data: ExperimentCreate, db: Session = Depends(get_session)):
    try:
        results = await run_experiment(
            dataset_id=data.dataset_id,
            provider=data.provider,
            model_id=data.model_id,
            temperature=data.temperature,
            prompt=data.prompt,
            db=db,
        )
        return {"message": "Dataset processado", "total_results": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
