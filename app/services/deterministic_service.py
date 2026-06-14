from sqlmodel import Session
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sqlmodel import select
from app.models.dataset import TestCase
from app.models.deterministic_metric import DeterministicMetric


async def calculate_metrics(results, db: Session):
    if not results:
        raise ValueError("Nenhum resultado foi fornecido para o cálculo de métricas.")

    try:
        model_id = results[0].model_id
        testcase_ids = [res.testcase_id for res in results]

        statement = select(TestCase).where(
            TestCase.id.is_not(None) & TestCase.id.in_(testcase_ids)
        )
        test_cases = db.exec(statement).all()
        gabarito = {tc.id: tc.expected_answer.strip().lower() for tc in test_cases}

        y_true = []
        y_pred = []

        for res in results:
            if res.testcase_id in gabarito:
                y_true.append(gabarito[res.testcase_id])
                y_pred.append(res.model_response.strip().lower())

        accuracy = accuracy_score(y_true, y_pred)

        labels = sorted(list(set(y_true)))
        matrix = confusion_matrix(y_true, y_pred, labels=labels)
        report = classification_report(
            y_true, y_pred, labels=labels, output_dict=True, zero_division=0
        )

        metrics = create_metrics(model_id, accuracy, labels, matrix, report, db)
        return metrics
    except Exception as e:
        raise ValueError(f"Erro ao calcular métricas: {e}")


def create_metrics(
    model_id: int,
    accuracy: float,
    labels: list,
    matrix: list,
    report: str | dict,
    db: Session,
):
    try:
        metrics = DeterministicMetric(
            model_id=model_id,
            accuracy=float(accuracy),
            labels=labels,
            confusion_matrix=matrix.tolist(),
            report=report,
        )

        db.add(metrics)
        db.commit()
        db.refresh(metrics)

        return metrics
    except Exception as e:
        raise ValueError(f"Erro ao criar métricas: {e}")


async def get_metrics(model_id: int, db: Session):
    try:
        statement = select(DeterministicMetric).where(
            DeterministicMetric.model_id == model_id
        )
        metrics = db.exec(statement).first()
        if not metrics:
            raise ValueError(
                f"Métricas não encontradas para o modelo com ID {model_id}."
            )

        return metrics
    except Exception as e:
        raise ValueError(f"Erro ao retornar métricas: {e}")
