import { NextResponse, type NextRequest } from "next/server";
import { getRawFile } from "@/lib/github";

// GET /api/github/raw?url=<raw download url>
//   → raw text of a file (size-capped), for inline preview. Only proxies
//   GitHub's raw host so it can't be used as an open proxy.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url é obrigatório" }, { status: 400 });
  }
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: "url inválido" }, { status: 400 });
  }
  if (host !== "raw.githubusercontent.com") {
    return NextResponse.json({ error: "host não permitido" }, { status: 400 });
  }

  try {
    const text = await getRawFile(url);
    if (text === null) {
      return NextResponse.json(
        { error: "Ficheiro demasiado grande ou binário." },
        { status: 413 },
      );
    }
    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
