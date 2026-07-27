import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Dataset } from "./datasets";
import type { EvalType } from "./evaluations";
import { getDatasets } from "../api/datasets";
import { getCredentials } from "../api/credentials";
import { getProviderModels } from "../api/providers";
import { runExperiment } from "../api/experiments";
import type { Credential } from "../api/credentials";

type ModelPick = {
  credentialId: number | null;
  model: string;
};

function RunPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [datasetId, setDatasetId] = useState(0);
  const [models, setModels] = useState<Record<string, string[]>>({});
  const [name, setName] = useState("");
  const [evalType, setEvalType] = useState<EvalType>("deterministic");
  const [picks, setPicks] = useState<ModelPick[]>([
    { credentialId: null, model: "" },
  ]);
  const [prompt, setPrompt] = useState(
    "Responda de forma concisa à pergunta utilizando o contexto fornecido.",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [datasets, credentials] = await Promise.all([
        getDatasets(),
        getCredentials(),
      ]);

      setDatasets(datasets);
      setCredentials(credentials);
    }

    load();
  }, []);
  
  useEffect(() => {
    async function loadModels() {
      const map: Record<string, string[]> = {};

      for (const credential of credentials) {
        map[credential.provider] = await getProviderModels(credential.provider);
      }

      setModels(map);
    }

    if (credentials.length > 0) {
      loadModels();
    }
  }, [credentials]);

  const updatePick = (i: number, next: Partial<ModelPick>) => {
    setPicks((p) =>
      p.map((row, idx) => (idx === i ? { ...row, ...next } : row)),
    );
  };
  const addPick = () =>
    setPicks((p) => [...p, { credentialId: null, model: "" }]);
  const removePick = (i: number) =>
    setPicks((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));

  const run = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do experimento");
      return;
    }

    if (!datasetId) {
      toast.error("Selecione um dataset");
      return;
    }

    const validPicks = picks.filter((p) => p.credentialId && p.model);

    if (validPicks.length === 0) {
      toast.error("Selecione um modelo");
      return;
    }

    setModalOpen(true);

    try {
      for (const pick of validPicks) {
        await runExperiment({
          name,
          dataset_id: datasetId,
          evaluation_type: evalType,
          prompt_content: prompt,
          credential_id: pick.credentialId!,
          model_name: pick.model,
          temperature: 0,
        });
      }

      toast.success("Experimento executado com sucesso!");

      navigate("/app/evaluations");
    } catch {
      toast.error("Erro ao executar experimento");
    } finally {
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Executar avaliação</h1>
          <p className="text-sm text-muted-foreground">
            Compare o desempenho de um ou mais modelos com o mesmo dataset e
            prompt.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/app/evaluations" })}
        >
          Ver histórico
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>
            Defina os parâmetros do experimento.
          </CardDescription>
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
              <Select
                value={evalType}
                onValueChange={(v) => setEvalType(v as EvalType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {datasets.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum dataset
                  </SelectItem>
                ) : (
                  datasets.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.number_lines} itens)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Modelos a avaliar</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addPick}
              >
                <Plus className="mr-1 h-4 w-4" /> Adicionar modelo
              </Button>
            </div>
            <div className="space-y-2">
              {picks.map((p, i) => {
                const credential = credentials.find(
                  (c) => c.id === p.credentialId,
                );
                const availableModels = credential
                  ? (models[credential.provider] ?? [])
                  : [];
                return (
                  <div
                    key={i}
                    className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <Select
                      value={p.credentialId}
                      onValueChange={(v) =>
                        updatePick(i, { credentialId: v, model: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Credencial" />
                      </SelectTrigger>
                      <SelectContent>
                        {credentials.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nenhuma credencial
                          </SelectItem>
                        ) : (
                          credentials.map((k) => (
                            <SelectItem key={k.id} value={k.id}>
                              {k.name} — {k.provider}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Select
                      value={p.model}
                      onValueChange={(v) => updatePick(i, { model: v })}
                      disabled={!credential}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            credential ? "Modelo" : "Selecione uma credencial"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
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
            <Textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
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
              Sua avaliação foi iniciada e pode levar alguns instantes. Você
              pode continuar usando o app — acompanhe o progresso e visualize o
              dashboard na página de histórico assim que for concluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
            <Button asChild>
              <Link to="/app/evaluations">Ir para histórico</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RunPage;
