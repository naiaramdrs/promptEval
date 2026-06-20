from pydantic import BaseModel


class CredentialResponse(BaseModel):
    id: int
    name: str
    provider: str
 
    
class CredentialCreate(BaseModel):
    name: str
    provider: str
    key: dict
