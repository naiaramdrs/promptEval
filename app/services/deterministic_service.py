from sqlmodel import Session
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sqlmodel import Session, select
from app.models.dataset import TestCase


async def calculate_metrics(results, db: Session):
    testcase_ids = [res.testcase_id for res in results]

    statement = select(TestCase).where(TestCase.id.in_(testcase_ids))
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
    
    report = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)

    metrics_data = {
        "is_deterministic": True,
        "accuracy": accuracy,
        "labels": labels,
        "confusion_matrix": matrix.tolist(),
        "detailed_report": report
    }
    
    return metrics_data

async def get_metrics(id: int):
    pass