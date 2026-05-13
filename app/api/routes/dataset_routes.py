from fastapi import APIRouter, Depends, UploadFile
from sqlmodel import Session
from app.core.database import get_session
from app.services.dataset_service import process_dataset_upload


router = APIRouter()


@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile, db: Session = Depends(get_session)):
    content = await file.read()
    filename = file.filename or "uploaded_file"
    dataset = await process_dataset_upload(content, filename, db)
    return {"message": "Dataset criado com sucesso", "id": dataset.id}
