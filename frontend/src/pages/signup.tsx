import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invalid, setInvalid] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setInvalid(true);
      toast.error("Dados inválidos");
      return;
    }
    setInvalid(false);
    toast.success("Cadastro realizado");
  };

  const errClass = invalid ? "border-destructive focus-visible:ring-destructive" : "";

  return (
    <>
      <AuthLayout>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Cadastro</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="sr-only">Nome</Label>
            <Input id="name" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className={errClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="sr-only">E-mail</Label>
            <Input id="email" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={errClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="sr-only">Senha</Label>
            <Input id="password" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className={errClass} />
          </div>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                Entrar
              </Link>
            </p>
            <Button type="submit">Cadastrar</Button>
          </div>
        </form>
      </AuthLayout>
      <Toaster position="bottom-right" />
    </>
  );
}

export default SignupPage;