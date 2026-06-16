export default function OfflinePage() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 text-4xl">📡</div>
      <h1 className="text-lg font-bold">Sem ligação</h1>
      <p className="mt-1 max-w-xs text-[13px] text-muted">
        Estás offline. As drives, exames e a sincronização precisam de internet —
        tenta novamente quando tiveres ligação.
      </p>
    </div>
  );
}
