import PageHeader from "@/components/PageHeader";
import ProgressoClient from "@/components/progress/ProgressoClient";

export default function ProgressoPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Progresso"
        subtitle="Percurso de aprendizagem e tarefas de estudo por cadeira, com percentagem concluída."
      />
      <ProgressoClient />
    </div>
  );
}
