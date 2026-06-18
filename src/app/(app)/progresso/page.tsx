import { redirect } from "next/navigation";

// Progresso is now reached through each cadeira (subject → Progresso tab).
export default function ProgressoPage() {
  redirect("/cadeiras");
}
