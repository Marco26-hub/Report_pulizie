import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cleaning" }, cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Block if any company already exists
  const { count } = await sb.from("companies").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-700">Setup iniziale</h1>
          <p className="text-sm text-gray-500 mt-1">Crea l'account admin e la tua azienda</p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
