import { requireAdmin } from "@/lib/auth";
import EmployeesList from "./EmployeesList";

export default async function EmployeesAdmin() {
  const { profile, sb } = await requireAdmin();
  const { data: employees } = await sb
    .from("profiles")
    .select("id, full_name, role, whatsapp_number, telegram_username, can_send_whatsapp, can_send_telegram, can_send_email, created_at")
    .eq("company_id", profile.company_id)
    .order("full_name");

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Dipendenti</h1>
      <EmployeesList employees={employees ?? []} currentUserId={profile.id} />
    </div>
  );
}
