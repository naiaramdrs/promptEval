from litellm import acompletion
from sqlmodel import Session, select
from app.models.model import Model
from app.models.dataset import TestCase
from app.models.execution import ExecutionConfig, ExecutionResult
from app.schemas.experiment_schema import ExperimentCreate


async def run_experiment(
    dataset_id: int,
    provider: str,
    model_id: str,
    temperature: float,
    prompt: str,
    db: Session,
):
    model_config = create_model(model_id, provider, temperature, prompt, db)

    statement = select(TestCase).where(TestCase.dataset_id == dataset_id)
    test_cases = db.exec(statement).all()

    results = []

    for test in test_cases:
        prompt = f"System: {prompt}\nContext: {test.context}\nUser: {test.query}"
        response_data = await get_model_response(
            prompt, provider, model_id, temperature
        )

        if model_config.id is None or test.id is None:
            raise ValueError("Erro ao recuperar ID do modelo")

        result = create_execution_result(
            model_config.id,
            response_data.choices[0].message.content,
            test.id,
            response_data.usage.prompt_tokens,
            response_data.usage.completion_tokens,
            (response_data.usage.prompt_tokens + response_data.usage.completion_tokens),
            db,
        )
        results.append(result)

    db.commit()
    print(results)
    return results


async def get_model_response(
    prompt: str, provider: str, model_id: str, temperature: float
):
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
    db.add(result)
    return result


def create_execution_config(data: ExperimentCreate, db: Session):
    execution_config = ExecutionConfig(
        experiment_id=data.experiment_id,
        prompt_id=data.prompt_id,
        credential_id=data.credential_id,
        model_name=data.model_name,
        temperature=data.temperature,
    )

    db.add(execution_config)
    db.commit()
    db.refresh(execution_config)

    return execution_config
