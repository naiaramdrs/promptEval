from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.database import get_session
from app.services.credential_service import (
    list_credentials,
    encrypt_key,
    create_credential,
    get_credential,
    delete_credential,
    update_credential,
)


router = APIRouter()


@router.post("/credentials")
def create_credentials(request: dict, db: Session = Depends(get_session)):
    name = request.get("name")
    provider = request.get("provider")
    key_json = request.get("key_encrypted")
    key_encrypted = encrypt_key(key_json)
    if not all([name, provider, key_encrypted]):
        return {
            "message": "Campos 'name', 'provider' e 'key_encrypted' são obrigatórios",
            "code": 400,
        }
    credential = create_credential(name, provider, key_encrypted, db)
    return {
        "message": "Credential criada com sucesso",
        "credential": credential,
        "code": 201,
    }


@router.get("/credentials")
def get_credentials(db: Session = Depends(get_session)):
    return list_credentials(db)


@router.get("/credentials/{credential_id}")
def get_credential_by_id(credential_id: int, db: Session = Depends(get_session)):
    credential = get_credential(credential_id, db)
    if credential:
        return credential
    return {"message": "Credential não encontrada", "code": 404}


@router.delete("/credentials/{credential_id}")
def delete_credentials(credential_id: int, db: Session = Depends(get_session)):
    success = delete_credential(credential_id, db)
    if success:
        return {"message": "Credential deletada com sucesso", "code": 200}
    return {"message": "Credential não encontrada", "code": 404}


@router.put("/credentials/{credential_id}")
def update_credentials(
    credential_id: int, request: dict, db: Session = Depends(get_session)
):
    name = request.get("name")
    provider = request.get("provider")
    key_json = request.get("key_encrypted")
    key_encrypted = encrypt_key(key_json)
    if not all([name, provider, key_encrypted]):
        return {
            "message": "Campos 'name', 'provider' e 'key_encrypted' são obrigatórios",
            "code": 400,
        }
    credential = update_credential(credential_id, name, provider, key_encrypted, db)
    if credential:
        return {
            "message": "Credential atualizada com sucesso",
            "credential": credential,
            "code": 200,
        }
    return {"message": "Credential não encontrada", "code": 404}
