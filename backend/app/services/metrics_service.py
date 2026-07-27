from sqlmodel import Session
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sqlmodel import select
from app.models.dataset import TestCase
from app.models.execution import ExecutionConfig, ExecutionResult
from collections import defaultdict
from app.models.prompt import Prompt
from app.models.dataset import Dataset
from app.models.experiment import Experiment
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
        "precision": report["weighted avg"]["precision"],
        "recall": report["weighted avg"]["recall"],
        "f1": report["weighted avg"]["f1-score"],
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
    experiment = get_experiment(experiment_id, db)
    dataset = get_dataset(experiment, db)
    configs = get_execution_configs(experiment_id, db)
    if not configs:
        return {
            "experiment_name": experiment.name,
            "dataset_name": "",
            "prompt": "",
            "evaluation_type": "",
            "models": [],
        }

    config_ids = [c.id for c in configs]

    metrics_by_config = get_metrics_by_config(config_ids, db)
    results_by_config = get_results_by_config(config_ids, db)
    prompt = get_prompt(configs[0], db)
    testcase_map = get_testcases_map(results_by_config, db)

    models = build_models(configs, metrics_by_config, results_by_config, testcase_map)

    return {
        "experimentName": experiment.name,
        "datasetName": dataset.name,
        "prompt": prompt.content if prompt else "",
        "evaluationType": experiment.evaluation_type,
        "createdAt": experiment.created_at,
        "models": models,
    }


def get_experiment(experiment_id: int, db: Session):
    experiment = db.get(Experiment, experiment_id)

    if not experiment:
        raise ValueError("Experimento não encontrado")

    return experiment


def get_execution_configs(experiment_id: int, db: Session):
    return db.exec(
        select(ExecutionConfig).where(ExecutionConfig.experiment_id == experiment_id)
    ).all()


def get_dataset(experiment: Experiment, db: Session):
    return db.get(Dataset, experiment.dataset_id)


def get_dataset(experiment: Experiment, db: Session):
    return db.get(Dataset, experiment.dataset_id)


def get_metrics_by_config(config_ids: list[int], db: Session):

    metrics = db.exec(
        select(Metrics).where(Metrics.execution_config_id.in_(config_ids))
    ).all()

    return {metric.execution_config_id: metric for metric in metrics}


def get_results_by_config(config_ids: list[int], db: Session):

    execution_results = db.exec(
        select(ExecutionResult).where(
            ExecutionResult.execution_config_id.in_(config_ids)
        )
    ).all()

    results_by_config = defaultdict(list)

    for result in execution_results:
        results_by_config[result.execution_config_id].append(result)

    return results_by_config


def get_prompt(config: ExecutionConfig, db: Session):

    return db.get(Prompt, config.prompt_id)


def get_testcases_map(results_by_config, db: Session):

    testcase_ids = list(
        {
            result.testcase_id
            for results in results_by_config.values()
            for result in results
        }
    )

    testcases = db.exec(select(TestCase).where(TestCase.id.in_(testcase_ids))).all()

    return {tc.id: tc for tc in testcases}


def build_models(configs, metrics_by_config, results_by_config, testcase_map):

    models = []

    for config in configs:
        metric = metrics_by_config.get(config.id)

        results = []

        input_tokens = 0
        output_tokens = 0
        total_tokens = 0

        for result in results_by_config.get(config.id, []):
            tc = testcase_map[result.testcase_id]

            input_tokens += result.prompt_tokens
            output_tokens += result.completion_tokens
            total_tokens += result.total_tokens

            results.append(
                {
                    "pergunta": tc.query,
                    "resposta_esperada": tc.expected_answer,
                    "contexto": tc.context,
                    "resposta_gerada": result.model_response,
                    "inputTokens": result.prompt_tokens,
                    "outputTokens": result.completion_tokens,
                    "totalTokens": result.total_tokens,
                }
            )

        models.append(
            {
                "executionConfigId": config.id,
                "modelName": config.model_name,
                "temperature": config.temperature,
                "metrics": metric.details_json if metric else {},
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "totalTokens": total_tokens,
                "results": results,
            }
        )

    return models
