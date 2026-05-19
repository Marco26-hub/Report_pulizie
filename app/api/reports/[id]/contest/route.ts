import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const runtime = "nodejs";

const routeLog = logger.withContext({ route: "/api/reports/[id]/contest" });
const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({ reason: z.string().min(1, "Motivo contestazione obbligatorio").max(1000) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) return NextResponse.json({ error: "invalid_report_id" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(ip, "/api/reports/[id]/contest");
  if (!rl.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const body = await req.json().catch(() => ({}));
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    const firstErr = parsedBody.error.flatten().formErrors[0] ?? "Dati non validi";
    return NextResponse.json({ error: firstErr }, { status: 400 });
  }

  const { sb } = await requireAdmin();
  const { error } = await sb.from("reports").update({
    status: "contestato",
    contested_reason: parsedBody.data.reason
  }).eq("id", parsedParams.data.id);
  if (error) {
    routeLog.error("Failed to contest report", error, { reportId: parsedParams.data.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  routeLog.info("Report contested", { reportId: parsedParams.data.id });
  return NextResponse.json({ ok: true });
}
