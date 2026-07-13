import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setInvalid(true);
      toast.error("Dados inválidos");
      return;
    }
    setInvalid(false);
    toast.success("E-mail enviado");
  };

  return (
    <>
      <AuthLayout>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Recuperar Senha</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="sr-only">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={invalid ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>
          <div className="flex justify-center pt-2">
            <Button type="submit">Enviar E-mail</Button>
          </div>
          <div className="text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Voltar para o login
            </Link>
          </div>
        </form>
      </AuthLayout>
      <Toaster position="bottom-right" />
    </>
  );
}

export default RecoverPage;