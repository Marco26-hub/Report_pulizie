import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { buildReportPdf } from "@/lib/pdf";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { optimizeForPdf } from "@/lib/image-optimize";
import { z } from "zod";
import type { Report } from "@/lib/database.types";

export const runtime = "nodejs";

const routeLog = logger.withContext({ route: "/api/reports/[id]/pdf" });
const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "invalid_report_id" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(ip, "/api/reports/[id]/pdf");
  if (!rl.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const { profile, sb } = await requireUser();
  const { data: report } = await sb.from("reports").select("*").eq("id", parsed.data.id).single();
  if (!report) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (profile.role !== "admin" && report.operator_id !== profile.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [{ data: operator }, { data: company }, { data: tasks }, { data: anomalies }, { data: photos }, { data: signatures }] = await Promise.all([
    sb.from("profiles").select("full_name").eq("id", report.operator_id).single(),
    sb.from("companies").select("*").eq("id", report.company_id).single(),
    sb.from("report_tasks").select("section, label, done, sort_order").eq("report_id", report.id).order("section").order("sort_order"),
    sb.from("report_anomalies").select("code, detail").eq("report_id", report.id),
    sb.from("report_photos").select("kind, storage_path, notes").eq("report_id", report.id),
    sb.from("report_signatures").select("kind, data_url").eq("report_id", report.id)
  ]);

  // download photo bytes via service role
  const admin = supabaseAdmin();
  interface PhotoRow { kind: string; storage_path: string; notes?: string | null }
  const photoBytes = await Promise.all((photos ?? []).map(async (p: PhotoRow) => {
    const { data } = await admin.storage.from("report-photos").download(p.storage_path);
    if (!data) return null;
    const ab = await data.arrayBuffer();
    const raw = new Uint8Array(ab);
    const optimized = await optimizeForPdf(raw);
    return { kind: p.kind, bytes: optimized.bytes, contentType: optimized.contentType, notes: p.notes };
  }));

  const bytes = await buildReportPdf({
    report: report as Report,
    operator_name: operator?.full_name ?? "",
    company,
    tasks: tasks ?? [],
    anomalies: anomalies ?? [],
    photos: photoBytes.filter((x): x is NonNullable<typeof x> => x !== null),
    signatures: signatures ?? []
  });

  const path = `${report.company_id}/${report.id}/report-${Date.now()}.pdf`;
  const { error: upErr } = await admin.storage.from("report-pdfs").upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true
  });
  if (upErr) {
    routeLog.error("Failed to upload PDF to storage", upErr, { reportId: report.id });
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: signed } = await admin.storage.from("report-pdfs").createSignedUrl(path, 60 * 60 * 24 * 7);
  await sb.from("reports").update({ pdf_url: path }).eq("id", report.id);

  routeLog.info("PDF generated", { reportId: report.id });
  return NextResponse.json({ url: signed?.signedUrl, path });
}
