from sqlmodel import Session, select

from app.models.user import User
from app.schemas.user_schema import UserResponse


def create_user(name: str, email: str, hashed_password: str, db: Session):
    user = User(name=name, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return response_user(user)


def response_user(user: User):
    return UserResponse(id=user.id, name=user.name, email=user.email)


def get_by_id(user_id: int, db: Session):
    user = db.get(User, user_id)
    if user:
        return response_user(user)
    return None


def list_users(db: Session):
    users = db.exec(select(User)).all()
    return [response_user(user) for user in users]


def update_user(user_id: int, name: str, email: str, hashed_password: str, db: Session):
    user = db.get(User, user_id)
    if user:
        user.name = name
        user.email = email
        user.hashed_password = hashed_password
        db.add(user)
        db.commit()
        db.refresh(user)
        return response_user(user)
    return None


def delete_user(user_id: int, db: Session):
    user = db.get(User, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False
