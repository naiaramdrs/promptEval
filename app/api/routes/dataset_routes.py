from fastapi import APIRouter, Depends, UploadFile
from sqlmodel import Session
from app.core.database import get_session
from app.services.dataset_service import (
    process_dataset_upload,
    get_dataset,
    list_datasets,
    delete_dataset,
)


router = APIRouter()


@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile, db: Session = Depends(get_session)):
    content = await file.read()
    filename = file.filename or "uploaded_file"
    dataset = await process_dataset_upload(content, filename, db)
    return {
        "message": "Dataset criado com sucesso",
        "id": dataset.id,
        "name": dataset.name,
    }


@router.get("/datasets")
def list_datasets(db: Session = Depends(get_session)):
    return list_datasets(db)


@router.get("/datasets/{dataset_id}")
def get_dataset_by_id(dataset_id: int, db: Session = Depends(get_session)):
    dataset = get_dataset(dataset_id, db)
    if dataset:
        return dataset
    return {"message": "Dataset não encontrado"}


@router.delete("/datasets/{dataset_id}")
def delete_dataset_by_id(dataset_id: int, db: Session = Depends(get_session)):
    delete_dataset(dataset_id, db)
    return {"message": "Dataset deletado com sucesso"}
