from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.utils.validation import hash_password, validate_email, validate_password
from app.core.database import get_session
from app.schemas.user_schema import UserCreate
from app.services.user_service import (
    create_user,
    delete_user,
    get_by_id,
    list_users,
    update_user,
)


router = APIRouter()


@router.post("/users")
def create(user: UserCreate, db: Session = Depends(get_session)):
    try:
        if not validate_email(user.email):
            return {"message": "Email inválido", "status": 400}

        if not validate_password(user.password):
            return {
                "message": "Senha inválida. A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.",
                "status": 400,
            }
        hashed_password = hash_password(user.password)
        user_created = create_user(user.name, user.email, hashed_password, db)
        return {
            "message": "Usuário criado com sucesso",
            "user": user_created,
            "status": 201,
        }
    except Exception as e:
        return {"message": "Erro ao criar usuário", "error": str(e), "status": 400}


@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_session)):
    user = get_by_id(user_id, db)
    if user:
        return {"user": user, "status": 200}
    return {"message": "Usuário não encontrado", "status": 404}


@router.get("/users")
def list(db: Session = Depends(get_session)):
    try:
        users = list_users(db)
        return {"users": users, "status": 200}
    except Exception as e:
        return {"message": "Erro ao listar usuários", "error": str(e), "status": 400}


@router.put("/users/{user_id}")
def update(user_id: int, user: UserCreate, db: Session = Depends(get_session)):
    try:
        user_updated = update_user(
            user_id, user.name, user.email, user.hashed_password, db
        )
        if user_updated:
            return {
                "message": "Usuário atualizado com sucesso",
                "user": user_updated,
                "status": 200,
            }
        return {"message": "Usuário não encontrado", "status": 404}
    except Exception as e:
        return {"message": "Erro ao atualizar usuário", "error": str(e), "status": 400}


@router.delete("/users/{user_id}")
def delete(user_id: int, db: Session = Depends(get_session)):
    try:
        deleted = delete_user(user_id, db)
        if deleted:
            return {"message": "Usuário deletado com sucesso", "status": 200}
        return {"message": "Usuário não encontrado", "status": 404}
    except Exception as e:
        return {"message": "Erro ao deletar usuário", "error": str(e), "status": 400}
