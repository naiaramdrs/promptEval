from pydantic import BaseModel


class CredentialResponse(BaseModel):
    id: int
    name: str
    provider: str
