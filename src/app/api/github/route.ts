import { NextResponse, type NextRequest } from "next/server";
import { listRepoContents } from "@/lib/github";

// GET /api/github?repo=owner/repo[&path=...][&ref=...]
//   → contents of a public GitHub repo path.
export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo");
  const path = request.nextUrl.searchParams.get("path") ?? "";
  const ref = request.nextUrl.searchParams.get("ref") || undefined;
  if (!repo) {
    return NextResponse.json({ error: "repo é obrigatório" }, { status: 400 });
  }

  try {
    const entries = await listRepoContents(repo, path, ref);
    return NextResponse.json({ entries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
