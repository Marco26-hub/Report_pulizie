import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const runtime = "nodejs";

const routeLog = logger.withContext({ route: "/api/setup" });

const schema = z.object({
  company_name: z.string().min(2),
  admin_name: z.string().min(2),
  admin_email: z.string().email(),
  admin_password: z.string().min(8)
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(ip, "/api/setup");
  if (!rl.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cleaning" }, auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Block if already set up
  const { count } = await admin.from("companies").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return NextResponse.json({ error: "already_setup" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { company_name, admin_name, admin_email, admin_password } = parsed.data;

  // 1. Create company
  const { data: company, error: compErr } = await admin
    .from("companies")
    .insert({ name: company_name })
    .select("id")
    .single();
  if (compErr || !company) {
    routeLog.error("Failed to create company", compErr ?? new Error("no company returned"), { company_name });
    return NextResponse.json({ error: compErr?.message ?? "company_failed" }, { status: 500 });
  }

  // 2. Create auth user
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: admin_email,
    password: admin_password,
    email_confirm: true,
    user_metadata: { full_name: admin_name }
  });
  if (authErr || !created.user) {
    routeLog.error("Failed to create auth user", authErr ?? new Error("no user returned"), { admin_email });
    await admin.from("companies").delete().eq("id", company.id);
    return NextResponse.json({ error: authErr?.message ?? "auth_failed" }, { status: 500 });
  }

  // 3. Create profile
  const { error: profErr } = await admin.from("profiles").insert({
    id: created.user.id,
    company_id: company.id,
    full_name: admin_name,
    role: "admin"
  });
  if (profErr) {
    routeLog.error("Failed to create profile", profErr, { userId: created.user.id });
    await admin.auth.admin.deleteUser(created.user.id);
    await admin.from("companies").delete().eq("id", company.id);
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  routeLog.info("Setup completed", { company_name, admin_email });
  return NextResponse.json({ ok: true });
}
