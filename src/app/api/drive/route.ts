import { NextResponse, type NextRequest } from "next/server";
import { listDriveFolder } from "@/lib/google";

// GET /api/drive?folderId=...  → immediate children of a public Drive folder.
export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get("folderId");
  if (!folderId) {
    return NextResponse.json({ error: "folderId é obrigatório" }, { status: 400 });
  }

  try {
    const files = await listDriveFolder(folderId);
    return NextResponse.json({ files });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
