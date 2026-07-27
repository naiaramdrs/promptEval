import type { ReactNode } from "react";
import logo from "@/assets/logo.svg";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <img src={logo} alt="Prompt Eval" className="mb-8 h-24 w-auto sm:h-28" />
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}