import PageHeader from "@/components/PageHeader";
import BibliotecaClient from "@/components/study/BibliotecaClient";

export default function BibliotecaPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Biblioteca"
        subtitle="Pesquisa materiais por tópico e gera resumos, flashcards, quizzes e mapas mentais a partir das tuas tarefas, percurso ou documentos."
      />
      <BibliotecaClient />
    </div>
  );
}
