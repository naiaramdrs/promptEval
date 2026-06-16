import os
import sqlalchemy
from pydantic import json
from sqlmodel import Session
from cryptography.fernet import Fernet

from app.models.credential import Credential
from app.schemas.credential_schema import CredentialResponse


cipher = Fernet(os.getenv("ENCRYPTION_KEY").encode())


def create_credential(name: str, provider: str, key_encrypted: str, db: Session):
    credential = Credential(name=name, provider=provider, key_encrypted=key_encrypted)
    db.add(credential)
    db.commit()
    db.refresh(credential)
    return response_credential(credential)


def get_credential(credential_id: int, db: Session):
    credential = db.get(Credential, credential_id)
    if credential:
        return response_credential(credential)
    return None


def delete_credential(credential_id: int, db: Session):
    credential = get_credential(credential_id, db)
    if credential:
        db.delete(credential)
        db.commit()
        return True
    return False


def list_credentials(db: Session):
    list_credentials = db.exec(sqlalchemy.select(Credential)).all()
    return [response_credential(credential) for credential in list_credentials]


def update_credential(
    credential_id: int, name: str, provider: str, key_encrypted: str, db: Session
):
    credential = db.get(Credential, credential_id)
    if credential:
        credential.name = name
        credential.provider = provider
        credential.key_encrypted = key_encrypted
        db.add(credential)
        db.commit()
        db.refresh(credential)
        return response_credential(credential)
    return None


def response_credential(credential: Credential):
    return CredentialResponse(
        id=credential.id, name=credential.name, provider=credential.provider
    )


def encrypt_key(key: json):
    json_key = json.dumps(key)
    return cipher.encrypt(json_key.encode())


def decrypt_key(key_encrypted: str):
    decrypted_key = cipher.decrypt(key_encrypted.encode())
    return json.loads(decrypted_key.decode())
