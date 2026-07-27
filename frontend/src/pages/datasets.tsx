import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Upload, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { loadJSON, saveJSON } from "../lib/storage";
import { getDatasets, uploadDataset, deleteDataset } from "../api/datasets";

export type DatasetItem = {
  id: string;
  pergunta: string;
  contexto: string;
  resposta: string;
};

export type Dataset = {
  id: number;
  name: string;
  format_name: string;
  number_lines: number;
};

const STORAGE_KEY = "promptEval.datasets";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function parseCSV(text: string): DatasetItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return {
      id: uid(),
      pergunta: cells[idx("pergunta")] ?? cells[0] ?? "",
      contexto: cells[idx("contexto")] ?? cells[1] ?? "",
      resposta: cells[idx("resposta")] ?? cells[2] ?? "",
    };
  });
}

function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [name, setName] = useState("");
  const [draft, setDraft] = useState<DatasetItem[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      const datasets = await getDatasets();
      setDatasets(datasets);
    };
    fetchDatasets();
  }, []);

  const persist = (next: Dataset[]) => {
    setDatasets(next);
    saveJSON(STORAGE_KEY, next);
  };

  const onFile = async (file: File) => {
    setFile(file);
    const text = await file.text();
    try {
      let items: DatasetItem[];
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        items = (Array.isArray(parsed) ? parsed : []).map((p: any) => ({
          id: uid(),
          pergunta: p.pergunta ?? p.question ?? "",
          contexto: p.contexto ?? p.context ?? "",
          resposta: p.resposta ?? p.expected ?? p.answer ?? "",
        }));
      } else {
        items = parseCSV(text);
      }
      setDraft(items);
      setFileName(file.name);
      if (!name) setName(file.name.replace(/\.(csv|json)$/i, ""));
      toast.success(`${items.length} itens importados`);
    } catch {
      toast.error("Arquivo inválido");
    }
  };

  const saveDataset = async () => {
    if (!name || draft.length === 0) {
      toast.error("Faça upload de um arquivo e defina um nome");
      return;
    }
    await uploadDataset(file);
    const updated = await getDatasets();
    setDatasets(updated);
    setName("");
    setDraft([]);
    setFileName("");
    toast.success("Dataset cadastrado");
  };

  const remove = (id: number) => {
    deleteDataset(id);
    const updated = datasets.filter((d) => d.id !== id);
    persist(updated);
    toast.success("Dataset removido");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Datasets</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre e gerencie datasets com pergunta, contexto e resposta esperada (CSV ou JSON).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Novo dataset</CardTitle>
          <CardDescription>Importe um arquivo CSV ou JSON contendo pergunta, contexto e resposta esperada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label>Arquivo (CSV ou JSON)</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json,application/json,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                console.log("onFile", f);
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {fileName ? (
                <>
                  <FileText className="h-5 w-5" />
                  <span className="font-medium text-foreground">{fileName}</span>
                  <span>({draft.length} itens)</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Clique para selecionar um arquivo CSV ou JSON
                </>
              )}
            </button>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveDataset} disabled={draft.length === 0 || !name}>
              Salvar dataset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datasets cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dataset cadastrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.number_lines}</TableCell>
                    <TableCell>{d.format_name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => remove(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default DatasetsPage;