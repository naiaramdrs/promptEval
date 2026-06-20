import json

import pandas as pd
from io import BytesIO
from pandas import DataFrame
from sqlmodel import Session, select
from app.models.dataset import Dataset, TestCase
from app.models.execution import ExecutionConfig, ExecutionResult


def create_dataset(name: str, format_name: str, number_lines: int, db: Session):

    dataset = Dataset(name=name, format_name=format_name, number_lines=number_lines)

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return dataset


def delete_dataset(dataset_id: int, db: Session):
    dataset = db.get(Dataset, dataset_id)
    if dataset:
        db.delete(dataset)
        db.commit()


def list_datasets(db: Session):
    return db.exec(select(Dataset)).all()


def get_dataset(dataset_id: int, db: Session):
    return db.get(Dataset, dataset_id)


def create_test_case(df: DataFrame, dataset: Dataset, db: Session):
    for _, row in df.iterrows():
        test_case = TestCase(
            query=row["query"],
            context=row["context"],
            expected_answer=row["expected_answer"],
            dataset_id=dataset.id,
        )

        db.add(test_case)
    db.commit()


async def process_dataset_upload(file_content: bytes, file_name: str, db: Session):
    try:
        buffer = BytesIO(file_content)
        df, format_name = get_dataframe(buffer, file_name)
        dataset = create_dataset(file_name, format_name, len(df), db)
        create_test_case(df, dataset, db)

        return dataset
    except Exception as e:
        raise ValueError("Erro ao processar dataset:", e)


def get_dataframe(buffer: BytesIO, file_name: str):
    format_name = file_name.split(".")[-1].lower()

    if format_name == "csv":
        df = pd.read_csv(buffer)
    elif format_name == "json":
        df = pd.read_json(buffer)
    else:
        raise ValueError("Formato não suportado")
    return df, format_name


def download_dataset(dataset_id: int, file_format: str, db: Session):
    dataset = get_dataset(dataset_id, db)
    if not dataset:
        raise ValueError("Dataset não encontrado")

    results = get_results_with_execution_config(dataset_id, db)
    data = {}

    for testcase, execution_result, execution_config in results:
        tc_id = testcase.id

        if tc_id not in data:
            data[tc_id] = {
                "query": testcase.query,
                "context": testcase.context,
                "expected_answer": testcase.expected_answer,
            }

        model_name = execution_config.model_name.replace("-", "_").replace(".", "_")

        data[tc_id][f"llm_response_{model_name}"] = execution_result.model_response

    rows = list(data.values())
    buffer, extension = create_download_buffer(rows, file_format)

    buffer.seek(0)

    return buffer, f"{dataset.name}.{extension}"


def get_results_with_execution_config(dataset_id: int, db: Session):
    return db.exec(
        select(TestCase, ExecutionResult, ExecutionConfig)
        .join(ExecutionResult, ExecutionResult.testcase_id == TestCase.id)
        .join(
            ExecutionConfig, ExecutionConfig.id == ExecutionResult.execution_config_id
        )
        .where(TestCase.dataset_id == dataset_id)
    ).all()


def create_download_buffer(rows: list, file_format: str):
    buffer = BytesIO()

    if file_format == "csv":
        pd.DataFrame(rows).to_csv(buffer, index=False)
        extension = "csv"
    elif file_format == "json":
        buffer.write(json.dumps(rows, ensure_ascii=False, indent=2).encode("utf-8"))
        extension = "json"
    else:
        raise ValueError("Formato inválido")
    return buffer, extension
