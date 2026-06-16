import { NextResponse, type NextRequest } from "next/server";
import { listDriveFolder } from "@/lib/google";

// GET /api/drive?folderId=...[&resourceKey=...]  → immediate children of a
// public Drive folder. resourceKey is required for legacy link-shared folders.
export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get("folderId");
  const resourceKey =
    request.nextUrl.searchParams.get("resourceKey") || undefined;
  if (!folderId) {
    return NextResponse.json({ error: "folderId é obrigatório" }, { status: 400 });
  }

  try {
    const files = await listDriveFolder(folderId, resourceKey);
    return NextResponse.json({ files });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
