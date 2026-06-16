import sqlalchemy
from sqlmodel import Session

from app.models.credential import Credential


def create_credential(provider: str, key_encrypted: str, db: Session):
    credential = Credential(provider=provider, key_encrypted=key_encrypted)
    db.add(credential)
    db.commit()
    db.refresh(credential)
    return credential


def get_credential(credential_id: int, db: Session):
    return db.get(Credential, credential_id)


def delete_credential(credential_id: int, db: Session):
    credential = get_credential(credential_id, db)
    if credential:
        db.delete(credential)
        db.commit()


def list_credentials(db: Session):
    return db.exec(sqlalchemy.select(Credential)).all()
