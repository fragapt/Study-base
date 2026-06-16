import PageHeader from "@/components/PageHeader";
import ConfiguracaoClient from "@/components/config/ConfiguracaoClient";

export default function ConfiguracaoPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Configuração"
        subtitle="As tuas drives, cadeiras, pastas, tópicos e calendário de exames."
      />
      <ConfiguracaoClient />
    </div>
  );
}
