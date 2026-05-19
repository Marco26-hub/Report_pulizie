import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key",
    { db: { schema: "cleaning" }, cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { count } = await sb.from("companies").select("id", { count: "exact", head: true });
  if ((count ?? 0) === 0) redirect("/setup");

  return <LoginForm />;
}
