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
import {
  getProviderCredentialFields,
  getProviders,
  type Provider,
} from "../api/providers";
import {
  createCredential,
  getCredentials,
  updateCredential,
  type CredentialPayload,
  type Credential,
  deleteCredential,
} from "../api/credentials";

const STORAGE_KEY = "promptEval.apiKeys";

function ApiKeysPage() {
  const [credentialsList, setCredentialsList] = useState<Credential[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState("");
  const [label, setLabel] = useState("");
  const [credentialFields, setCredentialFields] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  useEffect(() => {
    getCredentials().then(setCredentialsList);
  }, []);

  useEffect(() => {
    if (!provider) return;

    getProviderCredentialFields(provider).then((fields) => {
      setCredentialFields(fields);

      const empty: Record<string, string> = {};

      fields.forEach((field) => {
        empty[field] = "";
      });

      setCredentials(empty);
    });
  }, [provider]);

  const persist = (next: Credential[]) => {
    setCredentialsList(next);
    saveJSON(STORAGE_KEY, next);
  };

  const resetForm = () => {
    setEditingId(null);
    setLabel("");
    const empty: Record<string, string> = {};
    credentialFields.forEach((f) => (empty[f] = ""));
    setCredentials(empty);
  };

  const startEdit = (k: Credential) => {
    setEditingId(k.id);
    setProvider(k.provider);
    setLabel(k.name);
    setCredentials({ ...k.key });
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!label.trim()) {
      toast.error("Informe um rótulo");
      return;
    }

    const missing = credentialFields.filter((f) => !credentials[f]?.trim());

    if (missing.length > 0) {
      toast.error(`Preencha: ${missing.join(", ")}`);
      return;
    }

    const payload: CredentialPayload = {
      name: label,
      provider,
      key: credentials,
    };

    try {
      if (editingId) {
        await updateCredential(editingId, payload);
        toast.success("Chave atualizada");
      } else {
        await createCredential(payload);
        toast.success("Chave cadastrada");
      }

      const updated = await getCredentials();
      setCredentialsList(updated);

      resetForm();
    } catch {
      toast.error("Erro ao salvar credencial");
    }
  };

  const remove = (id: number) => {
    persist(credentialsList.filter((k) => k.id !== id));
    if (editingId === id) resetForm();
    deleteCredential(id);
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
            Escolha o provedor — os campos de credenciais e modelos disponíveis
            se ajustam automaticamente. As chaves ficam armazenadas apenas neste
            navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select
                value={provider}
                onValueChange={(value) => setProvider(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rótulo</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: Produção"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {credentialFields.map((field) => (
              <div key={field} className="space-y-2">
                <Label>{field}</Label>
                <Input
                  type={
                    field.includes("SECRET") || field.includes("KEY")
                      ? "password"
                      : "text"
                  }
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
            <Button onClick={submit}>
              {editingId ? "Atualizar chave" : "Salvar chave"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chaves cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {credentialsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma chave cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Rótulo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentialsList.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.provider}</TableCell>
                    <TableCell>{k.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(k)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(k.id)}
                          aria-label="Excluir"
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

export default ApiKeysPage;
