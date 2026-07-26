import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { Evaluation, ModelRun, ResultRow } from "./evaluations";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getDashboard,
  type DashboardModel,
  type DashboardResponse,
} from "../api/metrics";

const BRAND = "#FCC626";
const INK = "#242627";

// Palette for comparing multiple models (aligned with brand yellow).
const MODEL_COLORS = [
  "#FCC626",
  "#2563EB",
  "#16A34A",
  "#C73B3C",
  "#7C3AED",
  "#0891B2",
  "#D97706",
  "#DB2777",
];

function DashboardPage() {
  const { evalId } = useParams<{ evalId: string }>();

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    if (!evalId) return;

    getDashboard(Number(evalId)).then(setDashboard);
  }, [evalId]);

  if (!dashboard) {
    return (
      <div className="space-y-4">
        <BackButton />
        <p className="text-sm text-muted-foreground">
          Nenhuma métrica encontrada.
        </p>
      </div>
    );
  }

  const models = dashboard.models ?? [];
  if (models.length === 0) {
    return (
      <div className="space-y-4">
        <BackButton />
        <p className="text-sm text-muted-foreground">
          Esta avaliação ainda não foi concluída.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {dashboard.experimentName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dashboard.datasetName} ·{" "}
            {dashboard.evalType === "semantic" ? "Semântica" : "Determinística"}{" "}
            · {new Date(dashboard.createdAt).toLocaleString()}
          </p>
        </div>
        <BackButton />
      </header>

      {/* Comparison summary */}
      {models.length > 1 && <ComparisonSection models={models} />}

      {/* Prompt */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Prompt utilizado</CardTitle>
          <CardDescription>Prompt enviado a todos os modelos.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-sm">
            {dashboard.prompt}
          </pre>
        </CardContent>
      </Card>

      {/* Per-model breakdown */}
      {dashboard.models.map((metric, i) => (
        <ModelSection
          key={1}
          metric={metric}
          accentColor={MODEL_COLORS[i % MODEL_COLORS.length]}
        />
      ))}
    </div>
  );
}

function ComparisonSection({ models }: { models: ModelRun[] }) {
  const metricData = [
    { name: "Accuracy", key: "accuracy" as const },
    { name: "Precision", key: "precision" as const },
    { name: "Recall", key: "recall" as const },
    { name: "F1", key: "f1" as const },
  ].map((row) => {
    const entry: Record<string, string | number> = { name: row.name };
    for (const mr of models) {
      entry[mr.model] = +(mr.metrics[row.key] * 100).toFixed(1);
    }
    return entry;
  });

  const tokenData = models.map((mr) => ({
    name: mr.model,
    input: mr.metrics.inputTokens,
    output: mr.metrics.outputTokens,
  }));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Comparação entre modelos</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral do desempenho e custo dos {models.length} modelos
          avaliados.
        </p>
      </div>

      {/* Summary table */}
      <Card className="rounded-2xl">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Precision</TableHead>
                <TableHead className="text-right">Recall</TableHead>
                <TableHead className="text-right">F1</TableHead>
                <TableHead className="text-right">Corretas</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((mr, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                      style={{
                        background: MODEL_COLORS[i % MODEL_COLORS.length],
                      }}
                    />
                    <span className="font-mono text-xs">{mr.model}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({mr.providerName})
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(mr.metrics.accuracy)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(mr.metrics.precision)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(mr.metrics.recall)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(mr.metrics.f1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {mr.metrics.correctItems}/{mr.metrics.totalItems}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {mr.metrics.totalTokens.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Métricas principais</CardTitle>
            <CardDescription>Comparação lado a lado (%).</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metricData}
                margin={{ top: 16, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="name" stroke={INK} fontSize={12} />
                <YAxis stroke={INK} fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e5e0",
                  }}
                  formatter={(v: number) => `${v}%`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {models.map((mr, i) => (
                  <Bar
                    key={mr.model + i}
                    dataKey={mr.model}
                    fill={MODEL_COLORS[i % MODEL_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Consumo de tokens</CardTitle>
            <CardDescription>Input vs output por modelo.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tokenData}
                margin={{ top: 16, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="name" stroke={INK} fontSize={11} />
                <YAxis stroke={INK} fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e5e0",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="input"
                  stackId="t"
                  fill={BRAND}
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="output"
                  stackId="t"
                  fill="#242627"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ModelSection({
  metric,
  accentColor,
}: {
  metric: DashboardModel;
  accentColor: string;
}) {
  const m = metric.metrics;
  return (
    <section className="space-y-3 rounded-2xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: accentColor }}
        />
        <h2 className="text-lg font-semibold">{metric.modelName}</h2>
        <span className="text-xs text-muted-foreground">
          {1} · {1}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="F1-Score"
          value={pct(m.report["weighted avg"]["f1-score"])}
          accent
        />

        <MetricCard
          label="Avaliadas"
          value={m.report["weighted avg"].support.toLocaleString()}
        />

        <MetricCard label="Classes" value={m.labels.length.toString()} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Input tokens"
          value={metric.inputTokens.toLocaleString()}
        />
        <MetricCard
          label="Output tokens"
          value={metric.outputTokens.toLocaleString()}
        />
        <MetricCard
          label="Total tokens"
          value={metric.totalTokens.toLocaleString()}
          accent
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Matriz de confusão</CardTitle>
            <CardDescription>Predito × Real.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfusionMatrix confusion={matrixToConfusion(m.confusion_matrix)} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de tokens</CardTitle>
            <CardDescription>Total por resposta.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buildHistogram(
                  metric.results.map((r) => r.totalTokens),
                  10,
                )}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="label" stroke={INK} fontSize={11} />
                <YAxis stroke={INK} fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e5e0",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={accentColor}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <ResultsTable results={metric.results} />
    </section>
  );
}

function BackButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/app/evaluations">
        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao histórico
      </Link>
    </Button>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`rounded-2xl transition-shadow hover:shadow-sm ${
        accent ? "border-[#FCC626]/40 bg-[#FCC626]/5" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function matrixToConfusion(matrix: number[][]) {
  return {
    tp: matrix[0]?.[0] ?? 0,
    fn: matrix[0]?.[1] ?? 0,
    fp: matrix[1]?.[0] ?? 0,
    tn: matrix[1]?.[1] ?? 0,
  };
}


function ConfusionMatrix({
  confusion,
}: {
  confusion: { tp: number; fp: number; fn: number; tn: number };
}) {
  const { tp, fp, fn, tn } = confusion;
  const max = Math.max(tp, fp, fn, tn, 1);
  const cell = (v: number, good: boolean) => {
    const intensity = 0.15 + 0.55 * (v / max);
    const bg = good
      ? `rgba(22, 163, 74, ${intensity})`
      : `rgba(199, 59, 60, ${intensity})`;
    return (
      <div
        className="flex h-20 flex-col items-center justify-center rounded-md text-lg font-semibold tabular-nums"
        style={{ background: bg, color: INK }}
      >
        {v}
      </div>
    );
  };
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
      <div />
      <div className="text-center text-xs font-medium text-muted-foreground">
        Pred. Positivo
      </div>
      <div className="text-center text-xs font-medium text-muted-foreground">
        Pred. Negativo
      </div>

      <div className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground">
        Real Positivo
      </div>
      {cell(tp, true)}
      {cell(fn, false)}

      <div className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground">
        Real Negativo
      </div>
      {cell(fp, false)}
      {cell(tn, true)}
    </div>
  );
}


function buildHistogram(values: number[], bins: number) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: `${min}`, count: values.length }];
  const width = (max - min) / bins;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }));
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    buckets[idx].count++;
  }
  return buckets.map((b) => ({
    label: `${Math.round(b.from)}–${Math.round(b.to)}`,
    count: b.count,
  }));
}

function pct(v?: number) {
  if (v === undefined || v === null || Number.isNaN(v)) return "-";
  return `${(v * 100).toFixed(1)}%`;
}

function ResultsTable({ results }: { results: ResultRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) =>
      [r.pergunta, r.resposta_esperada, r.resposta_gerada].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [results, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Resultados individuais</CardTitle>
          <CardDescription>Uma linha por item do dataset.</CardDescription>
        </div>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por pergunta ou resposta…"
          className="sm:w-72"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Pergunta</TableHead>
                <TableHead className="min-w-[200px]">
                  Resposta esperada
                </TableHead>
                <TableHead className="min-w-[200px]">Resposta gerada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Input</TableHead>
                <TableHead className="text-right">Output</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Nenhum resultado.
                  </TableCell>
                </TableRow>
              ) : (
                slice.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell
                      className="max-w-[280px] truncate"
                      title={r.pergunta}
                    >
                      {r.pergunta}
                    </TableCell>
                    <TableCell
                      className="max-w-[280px] truncate"
                      title={r.resposta_esperada}
                    >
                      {r.resposta_esperada}
                    </TableCell>
                    <TableCell
                      className="max-w-[280px] truncate"
                      title={r.resposta_gerada}
                    >
                      {r.resposta_gerada}
                    </TableCell>
                    <TableCell>
                      {true ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Correto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          <XCircle className="h-3 w-3" /> Errado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {r.inputTokens}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {r.outputTokens}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-medium">
                      {r.totalTokens}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {filtered.length === 0
              ? "0 resultados"
              : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} de ${filtered.length}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="tabular-nums">
              Página {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardPage;
