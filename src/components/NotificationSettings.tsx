"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function NotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      !!VAPID_PUBLIC;
    setSupported(ok);
    if (ok) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(!!sub))
        .catch(() => {});
    }
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão negada.");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Falha ao registar a subscrição.");
      setSubscribed(true);
      setMsg("Notificações ativadas. Vais ser avisado dos exames.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao ativar notificações.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notificações desativadas.");
    } catch {
      setMsg("Erro ao desativar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-[13px] font-semibold">Notificações de exames</h2>
      {!supported ? (
        <p className="text-[13px] text-muted">
          As notificações push não estão disponíveis neste contexto (precisa de
          HTTPS, da app instalada e da chave VAPID configurada).
        </p>
      ) : (
        <>
          <p className="mb-3 text-[13px] text-muted">
            Recebe avisos 3 dias antes, 1 dia antes e na manhã de cada exame.
          </p>
          <Button
            variant={subscribed ? "secondary" : "default"}
            size="sm"
            onClick={subscribed ? disable : enable}
            disabled={busy}
          >
            {busy
              ? "A processar…"
              : subscribed
                ? "Desativar notificações"
                : "Ativar notificações"}
          </Button>
          {msg ? <p className="mt-2 text-[12px] text-muted">{msg}</p> : null}
        </>
      )}
    </div>
  );
}
