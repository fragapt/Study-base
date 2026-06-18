import { redirect } from "next/navigation";

// Drives now live inside Biblioteca → Ficheiros. Keep the old route working.
export default function DrivesPage() {
  redirect("/biblioteca?tab=ficheiros");
}
