import os
import re

from cryptography.fernet import Fernet


def validate_email(email: str):
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(email_regex, email) is not None


def validate_password(password: str):
    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
    return re.match(password_regex, password) is not None


cipher = Fernet(os.getenv("ENCRYPTION_KEY").encode())


def hash_password(password: str):

    hashed_password = cipher.encrypt(password.encode()).decode()
    return hashed_password
