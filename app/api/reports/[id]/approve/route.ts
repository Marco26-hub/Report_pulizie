import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const runtime = "nodejs";

const routeLog = logger.withContext({ route: "/api/reports/[id]/approve" });
const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "invalid_report_id" }, { status: 400 });

  const ip = _.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(ip, "/api/reports/[id]/approve");
  if (!rl.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const { profile, sb } = await requireAdmin();
  const { error } = await sb.from("reports").update({
    status: "approvato",
    approved_by: profile.id,
    approved_at: new Date().toISOString(),
    contested_reason: null
  }).eq("id", parsed.data.id);
  if (error) {
    routeLog.error("Failed to approve report", error, { reportId: parsed.data.id, userId: profile.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  routeLog.info("Report approved", { reportId: parsed.data.id, userId: profile.id });
  return NextResponse.json({ ok: true });
}
