import os
import time

from litellm import acompletion
from pydantic import json
from sqlmodel import Session, select
from app.models.credential import Credential
from app.models.model import Model
from app.models.dataset import TestCase
from app.models.execution import ExecutionConfig, ExecutionResult
from app.schemas.experiment_schema import ExperimentCreate
from app.services.credential_service import decrypt_key


async def run_experiment(
    dataset_id: int,
    execution_config_id: int,
    model_name: str,
    temperature: float,
    prompt: str,
    credential_id: int,
    db: Session,
):
    credential = db.exec(
        select(Credential).where(Credential.id == credential_id)
    ).first()
    if not credential:
        raise ValueError(f"Credencial com ID {credential_id} não encontrada.")

    provider = credential.provider
    api_key = decrypt_key(credential.key_encrypted)

    statement = select(TestCase).where(TestCase.dataset_id == dataset_id)
    test_cases = db.exec(statement).all()

    results = []

    for test in test_cases:
        full_prompt = f"System: {prompt}\nContext: {test.context}\nUser: {test.query}"

        start_time = time.time()

        response_data = await get_model_response(
            prompt=full_prompt,
            provider=provider,
            model_id=model_name,
            temperature=temperature,
            api_key=api_key,
        )

        end_time = time.time()
        execution_time_ms = int((end_time - start_time) * 1000)

        result = ExecutionResult(
            execution_config_id=execution_config_id,
            testcase_id=test.id,
            model_response=response_data.choices[0].message.content,
            prompt_tokens=response_data.usage.prompt_tokens,
            completion_tokens=response_data.usage.completion_tokens,
            total_tokens=response_data.usage.total_tokens,
            execution_time_ms=execution_time_ms,
        )

        db.add(result)
        results.append(result)

    db.commit()

    for r in results:
        db.refresh(r)

    return results


async def get_model_response(
    prompt: str,
    provider: str,
    model_id: str,
    temperature: float,
    api_key: str,
):
    read_keys(api_key)
    return await acompletion(
        model=f"{provider}/{model_id}",
        messages=[{"content": prompt, "role": "user"}],
        temperature=temperature,
    )


def create_model(
    name: str, provider: str, temperature: float, prompt: str, db: Session
):
    model = Model(
        name=name,
        provider=provider,
        temperature=temperature,
        prompt=prompt,
    )

    db.add(model)
    db.commit()
    db.refresh(model)

    return model


def create_execution_result(
    model_id: int,
    model_response: str,
    testcase_id: int,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    db: Session,
):
    result = ExecutionResult(
        model_id=model_id,
        testcase_id=testcase_id,
        model_response=model_response,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
    )

    return result


def create_execution_config(
    data: ExperimentCreate, experiment_id: int, prompt_id: int, db: Session
):
    execution_config = ExecutionConfig(
        experiment_id=experiment_id,
        prompt_id=prompt_id,
        credential_id=data.credential_id,
        model_name=data.model_name,
        temperature=data.temperature,
    )

    db.add(execution_config)
    db.commit()
    db.refresh(execution_config)

    return execution_config


def read_keys(api_key: json):
    for key, value in api_key.items():
        os.environ[key] = value
