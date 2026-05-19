import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, { ok: boolean; ms: number }> = {};
  let supabaseOk = false;

  try {
    const start = Date.now();
    const { data, error } = await supabaseAdmin().from("reports").select("id", { count: "exact", head: true });
    supabaseOk = !error;
    checks.supabase = { ok: supabaseOk, ms: Date.now() - start };
  } catch {
    checks.supabase = { ok: false, ms: 0 };
  }

  const status = supabaseOk ? 200 : 503;

  return NextResponse.json(
    { status: status === 200 ? "ok" : "degraded", checks },
    { status }
  );
}
