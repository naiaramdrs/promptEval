import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { loadJSON, saveJSON } from "@/lib/storage";
import { PROVIDER_LIST, SUPPORTED_PROVIDERS, type ProviderId } from "@/lib/providers";

export type ApiKey = {
  id: string;
  provider: ProviderId;
  providerName: string;
  label: string;
  credentials: Record<string, string>;
  createdAt: string;
};

const STORAGE_KEY = "promptEval.apiKeys";

function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [label, setLabel] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const providerConfig = useMemo(() => SUPPORTED_PROVIDERS[provider], [provider]);

  useEffect(() => {
    // reset credentials when provider changes (skip while editing to preserve loaded values)
    if (editingId) return;
    const empty: Record<string, string> = {};
    providerConfig.credential_fields.forEach((f) => (empty[f] = ""));
    setCredentials(empty);
  }, [providerConfig, editingId]);

  useEffect(() => {
    setKeys(loadJSON<ApiKey[]>(STORAGE_KEY, []));
  }, []);

  const persist = (next: ApiKey[]) => {
    setKeys(next);
    saveJSON(STORAGE_KEY, next);
  };

  const resetForm = () => {
    setEditingId(null);
    setLabel("");
    const empty: Record<string, string> = {};
    providerConfig.credential_fields.forEach((f) => (empty[f] = ""));
    setCredentials(empty);
  };

  const startEdit = (k: ApiKey) => {
    setEditingId(k.id);
    setProvider(k.provider);
    setLabel(k.label);
    setCredentials({ ...k.credentials });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    if (!label.trim()) {
      toast.error("Informe um rótulo");
      return;
    }
    const missing = providerConfig.credential_fields.filter((f) => !credentials[f]?.trim());
    if (missing.length > 0) {
      toast.error(`Preencha: ${missing.join(", ")}`);
      return;
    }
    if (editingId) {
      persist(
        keys.map((k) =>
          k.id === editingId
            ? {
                ...k,
                provider,
                providerName: providerConfig.display_name,
                label,
                credentials: { ...credentials },
              }
            : k,
        ),
      );
      resetForm();
      toast.success("Chave atualizada");
      return;
    }
    persist([
      {
        id: Math.random().toString(36).slice(2, 10),
        provider,
        providerName: providerConfig.display_name,
        label,
        credentials: { ...credentials },
        createdAt: new Date().toISOString(),
      },
      ...keys,
    ]);
    resetForm();
    toast.success("Chave cadastrada");
  };

  const remove = (id: string) => {
    persist(keys.filter((k) => k.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Chaves de API</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre chaves para acessar modelos de linguagem externos.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar chave" : "Nova chave"}</CardTitle>
          <CardDescription>
            Escolha o provedor — os campos de credenciais e modelos disponíveis se ajustam automaticamente.
            As chaves ficam armazenadas apenas neste navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as ProviderId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDER_LIST.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rótulo</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Produção" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {providerConfig.credential_fields.map((field) => (
              <div key={field} className="space-y-2">
                <Label>{field}</Label>
                <Input
                  type={field.includes("SECRET") || field.includes("KEY") ? "password" : "text"}
                  value={credentials[field] ?? ""}
                  onChange={(e) =>
                    setCredentials((c) => ({ ...c, [field]: e.target.value }))
                  }
                  placeholder={field}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            )}
            <Button onClick={submit}>{editingId ? "Atualizar chave" : "Salvar chave"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chaves cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma chave cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Rótulo</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.providerName}</TableCell>
                    <TableCell>{k.label}</TableCell>
                    <TableCell>{new Date(k.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(k)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(k.id)} aria-label="Excluir">
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

export default ApiKeysPage;