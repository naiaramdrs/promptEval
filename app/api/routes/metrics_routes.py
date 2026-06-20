from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.database import get_session
from app.services.metrics_service import get_metrics


router = APIRouter()


@router.get("/metrics/{experiment_id}")
async def get_deterministic_metrics(
    experiment_id: int, db: Session = Depends(get_session)
):
    try:
        return await get_metrics(experiment_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
