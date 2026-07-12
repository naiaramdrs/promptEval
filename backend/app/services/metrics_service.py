from sqlmodel import Session
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sqlmodel import select
from app.models.dataset import TestCase
from app.models.execution import ExecutionConfig
from app.models.metrics import Metrics


async def calculate_deterministic_metrics(
    results, execution_config_id: int, db: Session
):
    if not results:
        raise ValueError("Nenhum resultado fornecido")

    testcase_ids = [r.testcase_id for r in results]
    test_cases = db.exec(select(TestCase).where(TestCase.id.in_(testcase_ids))).all()

    gabarito = {tc.id: tc.expected_answer.strip().lower() for tc in test_cases}

    y_true = []
    y_pred = []

    for result in results:
        expected = gabarito.get(result.testcase_id)

        if expected:
            y_true.append(expected)
            y_pred.append(result.model_response.strip().lower())

    accuracy = accuracy_score(y_true, y_pred)
    labels = sorted(set(y_true))
    matrix = confusion_matrix(y_true, y_pred, labels=labels)
    report = classification_report(
        y_true, y_pred, labels=labels, output_dict=True, zero_division=0
    )

    details = {
        "accuracy": float(accuracy),
        "labels": labels,
        "confusion_matrix": matrix.tolist(),
        "report": report,
    }

    create_metric(execution_config_id, "deterministic", details, db)


def create_metric(
    execution_config_id: int, metric_type: str, details: dict, db: Session
):
    metric = Metrics(
        execution_config_id=execution_config_id,
        metric_type=metric_type,
        details_json=details,
    )

    db.add(metric)
    db.commit()
    db.refresh(metric)

    return metric


async def get_metrics(experiment_id: int, db: Session):
    metrics = db.exec(
        select(Metrics)
        .join(ExecutionConfig, Metrics.execution_config_id == ExecutionConfig.id)
        .where(ExecutionConfig.experiment_id == experiment_id)
    ).all()

    return metrics
