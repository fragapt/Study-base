import PageHeader from "@/components/PageHeader";
import ExamesClient from "@/components/exams/ExamesClient";

export default function ExamesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Exames"
        subtitle="Contagem decrescente de todos os exames do calendário."
      />
      <ExamesClient />
    </div>
  );
}
