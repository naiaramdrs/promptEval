import os
import re

from cryptography.fernet import Fernet
from app.models.user import User


def validate_email(email: str, db):
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(email_regex, email) is not None and email_exists(email, db) is False


def validate_password(password: str):
    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
    return re.match(password_regex, password) is not None


def email_exists(email: str, db):
    user = db.query(User).filter(User.email == email).first()
    return user is not None


cipher = Fernet(os.getenv("ENCRYPTION_KEY").encode())


def hash_password(password: str):

    hashed_password = cipher.encrypt(password.encode()).decode()
    return hashed_password
