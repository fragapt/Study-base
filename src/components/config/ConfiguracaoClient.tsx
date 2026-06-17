"use client";

import ImportTemplate from "./ImportTemplate";
import CalendarConfig from "./CalendarConfig";
import AiConfig from "./AiConfig";
import DrivesConfig from "./DrivesConfig";
import SubjectsConfig from "./SubjectsConfig";
import SubjectFolders from "./SubjectFolders";
import TopicsConfig from "./TopicsConfig";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-card border border-edge bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint ? <p className="mt-0.5 text-[12px] text-muted">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ConfiguracaoClient() {
  return (
    <div>
      <ImportTemplate />
      <Section
        title="Calendário de exames"
        hint="ID do calendário público do Google (Definições do calendário → ID do calendário). Tem de estar público."
      >
        <CalendarConfig />
      </Section>
      <Section
        title="IA (opcional)"
        hint="Credenciais IAedu (API key + channel ID) para gerar tarefas e percursos com IA na área de Progresso."
      >
        <AiConfig />
      </Section>
      <Section
        title="Fontes (Drive + GitHub)"
        hint="Cola um link de pasta do Google Drive ou um repositório do GitHub."
      >
        <DrivesConfig />
      </Section>
      <Section
        title="Cadeiras"
        hint="As tuas cadeiras. As palavras-chave ligam os exames do calendário à cadeira certa."
      >
        <SubjectsConfig />
      </Section>
      <Section
        title="Pastas por cadeira"
        hint="Liga pastas das drives a cada cadeira. Deteta automaticamente ou adiciona à mão."
      >
        <SubjectFolders />
      </Section>
      <Section
        title="Tópicos de estudo"
        hint="A checklist de progresso de cada cadeira."
      >
        <TopicsConfig />
      </Section>
    </div>
  );
}
