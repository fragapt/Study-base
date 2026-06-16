import PageHeader from "@/components/PageHeader";
import ExamesClient from "@/components/exams/ExamesClient";

export default function ExamesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Exames"
        subtitle="Contagem decrescente dos exames (eventos com “testes” no título)."
      />
      <ExamesClient />
    </div>
  );
}
