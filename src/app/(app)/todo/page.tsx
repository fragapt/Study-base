import PageHeader from "@/components/PageHeader";
import TodoClient from "@/components/todo/TodoClient";

export default function TodoPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Tarefas"
        subtitle="Tarefas com título, descrição e cadeira — sincronizadas entre dispositivos."
      />
      <TodoClient />
    </div>
  );
}
