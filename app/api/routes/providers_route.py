from fastapi import APIRouter
from app.api.config.providers import (
    get_provider,
    get_models,
    get_credential_fields,
)


router = APIRouter()


@router.get("/providers/{name}")
def get_providers(name: str):
    return get_provider(name)


@router.get("/providers/{provider_name}/models")
def get_provider_models(provider_name: str):
    return get_models(provider_name)


@router.get("/providers/{provider_name}/credential-fields")
def get_provider_credential_fields(provider_name: str):
    return get_credential_fields(provider_name)
