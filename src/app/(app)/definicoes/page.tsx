import PageHeader from "@/components/PageHeader";
import { HAS_SUPABASE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import NotificationSettings from "@/components/NotificationSettings";

export default async function DefinicoesPage() {
  let email: string | null = null;
  if (HAS_SUPABASE) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Definições"
        subtitle="Conta, notificações de exames e instalação no telemóvel."
      />

      <section className="mb-3 rounded-card border border-edge bg-card p-5">
        <h2 className="mb-1 text-[13px] font-semibold">Conta</h2>
        {email ? (
          <p className="text-[13px] text-muted">
            Sessão iniciada como <span className="text-fg">{email}</span>.
          </p>
        ) : (
          <p className="text-[13px] text-muted">
            Sem sessão (Supabase ainda não configurado).
          </p>
        )}
        {email ? (
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="rounded-card border border-edge px-3 py-1.5 text-[13px] text-muted transition-colors hover:bg-card2 hover:text-fg"
            >
              Terminar sessão
            </button>
          </form>
        ) : null}
      </section>

      <section className="mb-3 rounded-card border border-edge bg-card p-5">
        <NotificationSettings />
      </section>

      <section className="rounded-card border border-edge bg-card p-5">
        <h2 className="mb-1 text-[13px] font-semibold">Instalar no telemóvel</h2>
        <p className="text-[13px] text-muted">
          No Android (Chrome): menu <span className="text-fg">⋮</span> →{" "}
          <span className="text-fg">Instalar aplicação</span> (ou “Adicionar ao
          ecrã principal”). Depois abre a app pelo ícone para a usares em ecrã
          inteiro e receberes notificações.
        </p>
      </section>
    </div>
  );
}
