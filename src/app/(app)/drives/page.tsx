import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import DrivesClient from "@/components/drives/DrivesClient";

export default function DrivesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Drives"
        subtitle="Navega nas pastas e abre os ficheiros sem sair da app."
      />
      <Suspense
        fallback={
          <div className="py-2 text-[12px] italic text-muted">A carregar…</div>
        }
      >
        <DrivesClient />
      </Suspense>
    </div>
  );
}
