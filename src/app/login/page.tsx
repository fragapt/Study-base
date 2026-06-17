"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar sessão.");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-card border border-edge bg-card p-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-accent text-2xl">
          📚
        </div>
        <h1 className="text-lg font-bold">Base de Estudo</h1>
        <p className="mt-1 mb-6 text-[13px] text-muted">
          Inicia sessão para sincronizar as tuas notas e progresso.
        </p>

        {HAS_SUPABASE ? (
          <Button onClick={signIn} disabled={loading} size="lg" className="w-full">
            {loading ? "A redirecionar…" : "Continuar com Google"}
          </Button>
        ) : (
          <p className="rounded-card border border-edge bg-app p-3 text-[12px] text-muted">
            Configura o Supabase (ver <code>SETUP.md</code>) para ativar o início
            de sessão.
          </p>
        )}

        {error ? (
          <p className="mt-3 text-[12px] text-red">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
