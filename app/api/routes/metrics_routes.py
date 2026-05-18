from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.database import get_session
from app.services.deterministic_service import get_metrics


router = APIRouter()


@router.get("/metrics/deterministic/{model_id}")
async def get_deterministic_metrics(model_id: int, db: Session = Depends(get_session)):
    try:
        return await get_metrics(model_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
