import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const runtime = "nodejs";

const routeLog = logger.withContext({ route: "/api/employees/create" });

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["employee", "admin"]).default("employee"),
  temp_password: z.string().min(8)
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(ip, "/api/employees/create");
  if (!rl.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const { profile } = await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { full_name, email, role, temp_password } = parsed.data;
  const admin = supabaseAdmin();

  // Create auth user (email confirmed, no verification needed)
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
    user_metadata: { full_name }
  });
  if (authErr || !created.user) {
    routeLog.error("Failed to create auth user for employee", authErr ?? new Error("no user returned"), { email, companyId: profile.company_id });
    return NextResponse.json({ error: authErr?.message ?? "create_failed" }, { status: 500 });
  }

  // Create profile
  const { error: profErr } = await admin.from("profiles").insert({
    id: created.user.id,
    company_id: profile.company_id,
    full_name,
    role,
    can_send_whatsapp: true,
    can_send_telegram: true,
    can_send_email: true
  });
  if (profErr) {
    routeLog.error("Failed to create profile for employee", profErr, { userId: created.user.id });
    // Rollback auth user
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  routeLog.info("Employee created", { userId: created.user.id, companyId: profile.company_id });
  return NextResponse.json({ ok: true, user_id: created.user.id });
}
