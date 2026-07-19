from fastapi import File

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from app.core.database import get_session
from app.services.dataset_service import (
    process_dataset_upload,
    get_dataset,
    list_datasets,
    delete_dataset,
    download_dataset,
)


router = APIRouter()


@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_session)):
    content = await file.read()
    filename = file.filename or "uploaded_file"
    dataset = await process_dataset_upload(content, filename, db)
    return {
        "message": "Dataset criado com sucesso",
        "id": dataset.id,
        "name": dataset.name,
    }


@router.get("/datasets")
def get_datasets(db: Session = Depends(get_session)):
    return list_datasets(db)


@router.get("/datasets/{dataset_id}")
def get_dataset_by_id(dataset_id: int, db: Session = Depends(get_session)):
    dataset = get_dataset(dataset_id, db)
    if dataset:
        return dataset
    raise HTTPException(status_code=404, detail="Dataset não encontrado")


@router.delete("/datasets/{dataset_id}")
def delete_dataset_by_id(dataset_id: int, db: Session = Depends(get_session)):
    delete_dataset(dataset_id, db)
    return {"message": "Dataset deletado com sucesso"}


@router.get("/datasets/{dataset_id}/download")
def download_datasets(
    dataset_id: int, file_format: str, db: Session = Depends(get_session)
):
    try:
        buffer, filename = download_dataset(dataset_id, file_format, db)
        media_type = "text/csv" if file_format == "csv" else "application/json"

        return StreamingResponse(
            buffer,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
