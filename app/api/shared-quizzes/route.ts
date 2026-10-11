import { auth } from "@/auth";
import { getSharedQuizzesDB } from "@/lib/actions/collaboration.actions";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const result = await getSharedQuizzesDB();
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data ?? [] });
}
