import pandas as pd
from io import BytesIO
from pandas import DataFrame
import sqlalchemy
from sqlmodel import Session
from app.models.dataset import Dataset, TestCase


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
    return db.exec(sqlalchemy.select(Dataset)).all()


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
