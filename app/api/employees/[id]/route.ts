import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const runtime = "nodejs";

const routeLog = logger.withContext({ route: "/api/employees/[id]" });

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  role: z.enum(["employee", "admin"]).optional(),
  can_send_whatsapp: z.boolean().optional(),
  can_send_telegram: z.boolean().optional(),
  can_send_email: z.boolean().optional(),
  disabled: z.boolean().optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(ip, "/api/employees/[id]");
  if (!rl.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const { profile, sb } = await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Verify employee belongs to same company
  const { data: emp } = await sb.from("profiles").select("id").eq("id", params.id).eq("company_id", profile.company_id).single();
  if (!emp) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { disabled, ...profileFields } = parsed.data;

  if (Object.keys(profileFields).length) {
    await sb.from("profiles").update(profileFields).eq("id", params.id);
  }

  if (disabled !== undefined) {
    const admin = supabaseAdmin();
    await admin.auth.admin.updateUserById(params.id, { ban_duration: disabled ? "876600h" : "none" });
  }

  routeLog.info("Employee updated", { userId: params.id, companyId: profile.company_id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(ip, "/api/employees/[id]");
  if (!rl.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const { profile, sb } = await requireAdmin();
  const { data: emp } = await sb.from("profiles").select("id").eq("id", params.id).eq("company_id", profile.company_id).single();
  if (!emp) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Cannot delete yourself
  if (params.id === profile.id) return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });

  const admin = supabaseAdmin();
  await admin.auth.admin.deleteUser(params.id);
  // Profile deleted via cascade
  routeLog.info("Employee deleted", { userId: params.id, companyId: profile.company_id });
  return NextResponse.json({ ok: true });
}
