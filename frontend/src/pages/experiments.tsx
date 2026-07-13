import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { loadJSON, saveJSON } from "@/lib/storage";
import { SUPPORTED_PROVIDERS } from "@/lib/providers";
import type { Dataset } from "./datasets";
import type { ApiKey } from "./_app.app.api-keys";
import type { Evaluation, EvalType, ModelRun, ResultRow } from "./evaluations";
import { STORAGE_KEY as EVAL_KEY } from "./evaluations";

type ModelPick = { credentialId: string; model: string };

function RunPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [name, setName] = useState("");
  const [evalType, setEvalType] = useState<EvalType>("deterministic");
  const [picks, setPicks] = useState<ModelPick[]>([{ credentialId: "", model: "" }]);
  const [prompt, setPrompt] = useState(
    "Responda de forma concisa à pergunta utilizando o contexto fornecido.",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setDatasets(loadJSON<Dataset[]>("promptEval.datasets", []));
    setKeys(loadJSON<ApiKey[]>("promptEval.apiKeys", []));
  }, []);

  const dataset = useMemo(() => datasets.find((d) => d.id === datasetId), [datasets, datasetId]);

  const updatePick = (i: number, next: Partial<ModelPick>) => {
    setPicks((p) => p.map((row, idx) => (idx === i ? { ...row, ...next } : row)));
  };
  const addPick = () => setPicks((p) => [...p, { credentialId: "", model: "" }]);
  const removePick = (i: number) =>
    setPicks((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));

  const run = async () => {
    if (!name.trim()) return toast.error("Informe o nome do experimento");
    if (!dataset) return toast.error("Selecione um dataset");
    const validPicks = picks.filter((p) => p.credentialId && p.model);
    if (validPicks.length === 0) return toast.error("Selecione ao menos um modelo");

    const id = Math.random().toString(36).slice(2, 10);
    const pending: Evaluation = {
      id,
      name: name.trim(),
      datasetName: dataset.name,
      prompt,
      evalType,
      createdAt: new Date().toISOString(),
      status: "running",
      models: [],
    };
    saveJSON(EVAL_KEY, [pending, ...loadJSON<Evaluation[]>(EVAL_KEY, [])]);
    setModalOpen(true);

    await new Promise((r) => setTimeout(r, 1500));

    const modelRuns: ModelRun[] = validPicks.map(({ credentialId, model }) => {
      const key = keys.find((k) => k.id === credentialId)!;
      return simulateModelRun(dataset, model, key);
    });

    const current = loadJSON<Evaluation[]>(EVAL_KEY, []);
    const updated = current.map((e) =>
      e.id === id ? { ...e, status: "completed" as const, models: modelRuns } : e,
    );
    saveJSON(EVAL_KEY, updated);
    toast.success("Avaliação concluída");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Executar avaliação</h1>
          <p className="text-sm text-muted-foreground">
            Compare o desempenho de um ou mais modelos com o mesmo dataset e prompt.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/app/evaluations" })}>
          Ver histórico
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>Defina os parâmetros do experimento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do experimento</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Baseline vs GPT-5"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de avaliação</Label>
              <Select value={evalType} onValueChange={(v) => setEvalType(v as EvalType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deterministic">Determinística</SelectItem>
                  <SelectItem value="semantic">Semântica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dataset</Label>
            <Select value={datasetId} onValueChange={setDatasetId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {datasets.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhum dataset</SelectItem>
                ) : (
                  datasets.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.items.length})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Modelos a avaliar</Label>
              <Button type="button" size="sm" variant="outline" onClick={addPick}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar modelo
              </Button>
            </div>
            <div className="space-y-2">
              {picks.map((p, i) => {
                const key = keys.find((k) => k.id === p.credentialId);
                const models = key ? SUPPORTED_PROVIDERS[key.provider].models : [];
                return (
                  <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <Select
                      value={p.credentialId}
                      onValueChange={(v) => updatePick(i, { credentialId: v, model: "" })}
                    >
                      <SelectTrigger><SelectValue placeholder="Credencial" /></SelectTrigger>
                      <SelectContent>
                        {keys.length === 0 ? (
                          <SelectItem value="none" disabled>Nenhuma chave</SelectItem>
                        ) : (
                          keys.map((k) => (
                            <SelectItem key={k.id} value={k.id}>
                              {k.providerName} — {k.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Select
                      value={p.model}
                      onValueChange={(v) => updatePick(i, { model: v })}
                      disabled={!key}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={key ? "Modelo" : "Selecione uma credencial"} />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePick(i)}
                      disabled={picks.length <= 1}
                      aria-label="Remover modelo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button onClick={run} disabled={modalOpen}>
              {modalOpen ? "Executando..." : "Executar avaliação"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#FCC626]" />
              Avaliação em execução
            </DialogTitle>
            <DialogDescription>
              Sua avaliação foi iniciada e pode levar alguns instantes. Você pode continuar
              usando o app — acompanhe o progresso e visualize o dashboard na página de
              histórico assim que for concluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Fechar</Button>
            <Button asChild>
              <Link to="/app/evaluations">Ir para histórico</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function simulateModelRun(dataset: Dataset, model: string, key: ApiKey): ModelRun {
  const n = dataset.items.length || 1;
  const tp = Math.round(n * (0.45 + Math.random() * 0.35));
  const fp = Math.round(n * (0.05 + Math.random() * 0.15));
  const fn = Math.round(n * (0.05 + Math.random() * 0.15));
  const tn = Math.max(0, n - tp - fp - fn);
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(0.001, precision + recall);
  const accuracy = (tp + tn) / Math.max(1, tp + fp + fn + tn);

  const correctFlags = Array.from({ length: dataset.items.length }, (_, i) => i < tp + tn);
  for (let i = correctFlags.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [correctFlags[i], correctFlags[j]] = [correctFlags[j], correctFlags[i]];
  }

  const results: ResultRow[] = dataset.items.map((it, i) => {
    const inputTokens = 60 + Math.floor(Math.random() * 140);
    const outputTokens = 30 + Math.floor(Math.random() * 120);
    return {
      pergunta: it.pergunta,
      contexto: it.contexto,
      resposta_esperada: it.resposta,
      resposta_gerada: `[${model}] ${it.resposta}`,
      correct: correctFlags[i] ?? true,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    };
  });

  const inputTokens = results.reduce((a, r) => a + r.inputTokens, 0);
  const outputTokens = results.reduce((a, r) => a + r.outputTokens, 0);
  const totalTokens = inputTokens + outputTokens;
  const correctItems = results.filter((r) => r.correct).length;

  return {
    provider: key.provider,
    providerName: key.providerName,
    model,
    credentialLabel: key.label,
    metrics: {
      precision,
      recall,
      f1,
      accuracy,
      totalTokens,
      inputTokens,
      outputTokens,
      totalItems: results.length,
      correctItems,
      confusion: { tp, fp, fn, tn },
    },
    results,
  };
}

export default RunPage;