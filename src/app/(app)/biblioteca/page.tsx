import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import BibliotecaHub from "@/components/study/BibliotecaHub";

export default function BibliotecaPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Biblioteca"
        subtitle="O teu armazém de estudo: ficheiros das drives e conteúdo gerado (resumos, flashcards, quizzes, mapas mentais) por cadeira."
      />
      <Suspense
        fallback={
          <div className="py-2 text-[12px] italic text-muted">A carregar…</div>
        }
      >
        <BibliotecaHub />
      </Suspense>
    </div>
  );
}
