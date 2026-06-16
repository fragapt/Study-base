import PageHeader from "@/components/PageHeader";
import ProgressoClient from "@/components/progress/ProgressoClient";

export default function ProgressoPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Progresso"
        subtitle="Checklists de tópicos por cadeira, com percentagem concluída."
      />
      <ProgressoClient />
    </div>
  );
}
