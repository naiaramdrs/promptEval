import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import {
  getExperiments,
  deleteExperiment,
  type Experiment,
} from "../api/experiments";
import { downloadDataset } from "../api/datasets";
import { Trash2 } from "lucide-react";

function csvEscape(v: string) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(ev: Evaluation) {
  const header = [
    "modelo",
    "pergunta",
    "contexto",
    "resposta_esperada",
    "resposta_gerada",
    "correto",
    "input_tokens",
    "output_tokens",
    "total_tokens",
  ];
  const lines: string[] = [header.join(",")];
  for (const mr of ev.models ?? []) {
    for (const r of mr.results ?? []) {
      lines.push(
        [
          mr.model,
          r.pergunta,
          r.contexto,
          r.resposta_esperada,
          r.resposta_gerada,
          "yes", // TODO: compute correctness
          String(r.inputTokens ?? ""),
          String(r.outputTokens ?? ""),
          String(r.totalTokens ?? ""),
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  }
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (ev.name || ev.datasetName || "avaliacao").replace(
    /[^a-z0-9-_]+/gi,
    "_",
  );
  a.download = `${safeName}_${ev.id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type EvaluationStatus = "running" | "completed" | "failed";

export type EvalType = "deterministic" | "semantic";

export interface ResultRow {
  pergunta: string;
  contexto: string;
  resposta_esperada: string;
  resposta_gerada: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export type ModelMetrics = {
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalItems: number;
  correctItems: number;
  confusion_matrix: { tp: number; fp: number; fn: number; tn: number };
};

export type ModelRun = {
  provider: string;
  providerName: string;
  model: string;
  credentialLabel: string;
  metrics: ModelMetrics;
  results: ResultRow[];
};

export type Evaluation = {
  id: string;
  name: string;
  datasetName: string;
  prompt: string;
  evalType: EvalType;
  createdAt: string;
  status: EvaluationStatus;
  errorMessage?: string;
  models?: ModelRun[];
};

export const STORAGE_KEY = "promptEval.evaluations";

function EvaluationsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  useEffect(() => {
    let interval: number;

    const fetchExperiments = async () => {
      const data = await getExperiments();

      setExperiments(data);

      const hasRunning = data.some(
        (experiment) => experiment.status === "running",
      );

      if (!hasRunning && interval) {
        clearInterval(interval);
      }
    };

    fetchExperiments();

    interval = window.setInterval(fetchExperiments, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const remove = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta avaliação?")) {
      return;
    }
    await deleteExperiment(id);
    setExperiments((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Histórico de avaliações</h1>
          <p className="text-sm text-muted-foreground">
            Todas as avaliações executadas.
          </p>
        </div>
        <Button asChild className="sm:w-auto">
          <Link to="/app/run">Nova avaliação</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          {experiments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação realizada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Experimento</TableHead>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.created_at
                        ? new Date(e.created_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>

                    <TableCell>{e.name}</TableCell>

                    <TableCell>{e.dataset_id}</TableCell>

                    <TableCell>{e.evaluation_type}</TableCell>

                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-start gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/app/dashboard/${e.id}`}>Dashboard</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadDataset(
                              e.dataset_id,
                              "csv",
                              `dataset-${e.dataset_id}.csv`,
                            )
                          }
                        >
                          Baixar CSV
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(e.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const map: Record<EvaluationStatus, { label: string; className: string }> = {
    running: {
      label: "Executando",
      className: "bg-[#FCC626]/20 text-[#8a6a00] border border-[#FCC626]",
    },
    completed: {
      label: "Concluído",
      className: "bg-emerald-100 text-emerald-800 border border-emerald-500",
    },
    failed: {
      label: "Falhou",
      className: "bg-red-100 text-red-800 border border-red-500",
    },
  };
  const s = map[status] ?? {
    label: "Desconhecido",
    className: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export default EvaluationsPage;
