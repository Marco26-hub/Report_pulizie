import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/utils";
import type { ReportStatus } from "@/lib/constants";
import { PaginationLoadMore, buildCursorHref } from "@/components/PaginationLoadMore";

type ReportRow = {
  id: string;
  intervention_date: string;
  client_name: string;
  address: string;
  status: string;
  total_hours: number | null;
  operator: { full_name: string } | { full_name: string }[] | null;
};

type HourRow = { total_hours: number | null };

const PAGE_SIZE = 25;

export default async function AdminDashboard({ searchParams }: {
  searchParams: { date?: string; operator?: string; client?: string; status?: string; anomaly?: string; cursor_date?: string; cursor_id?: string };
}) {
  const { profile, sb } = await requireAdmin();
  const today = todayISO();

  let q = sb
    .from("reports")
    .select("id, intervention_date, client_name, address, status, total_hours, operator:profiles!reports_operator_id_fkey(full_name)")
    .order("intervention_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (searchParams.date) q = q.eq("intervention_date", searchParams.date);
  if (searchParams.operator) q = q.eq("operator_id", searchParams.operator);
  if (searchParams.client) q = q.ilike("client_name", `%${searchParams.client}%`);
  if (searchParams.status) q = q.eq("status", searchParams.status);
  if (searchParams.cursor_date && searchParams.cursor_id) {
    q = q.or(
      `intervention_date.lt.${searchParams.cursor_date},and(intervention_date.eq.${searchParams.cursor_date},id.lt.${searchParams.cursor_id})`
    );
  }

  const [{ data: raw }, { count: todayCount }, { count: pendingCount }, { count: contestedCount }, { data: operators }, { data: hoursToday }] = await Promise.all([
    q,
    sb.from("reports").select("id", { count: "exact", head: true }).eq("intervention_date", today),
    sb.from("reports").select("id", { count: "exact", head: true }).eq("status", "completato"),
    sb.from("reports").select("id", { count: "exact", head: true }).eq("status", "contestato"),
    sb.from("profiles").select("id, full_name").eq("company_id", profile.company_id).eq("role", "employee"),
    sb.from("reports").select("total_hours").eq("intervention_date", today)
  ]);

  const hasMore = (raw?.length ?? 0) > PAGE_SIZE;
  const latest = raw?.slice(0, PAGE_SIZE) ?? [];

  const totalHoursToday = (hoursToday ?? []).reduce((s: number, r: HourRow) => s + Number(r.total_hours ?? 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Dashboard Admin</h1>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Report oggi" value={todayCount ?? 0} />
        <Stat label="Ore oggi" value={totalHoursToday.toFixed(1)} />
        <Stat label="In approvazione" value={pendingCount ?? 0} />
        <Stat label="Contestati" value={contestedCount ?? 0} />
      </div>

      <form className="card p-3 grid grid-cols-2 gap-2 text-sm">
        <input type="date" name="date" defaultValue={searchParams.date} className="input" />
        <select name="operator" defaultValue={searchParams.operator || ""} className="input">
          <option value="">Tutti operatori</option>
          {operators?.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
        </select>
        <input name="client" placeholder="Cliente" defaultValue={searchParams.client} className="input" />
        <select name="status" defaultValue={searchParams.status || ""} className="input">
          <option value="">Tutti stati</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-primary col-span-2">Filtra</button>
      </form>

      <ul className="space-y-2">
        {latest?.map((r: ReportRow) => {
          const status = r.status as ReportStatus;
          const operatorName = Array.isArray(r.operator) ? r.operator[0]?.full_name : (r.operator?.full_name ?? null);
          return (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="card p-3 block">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.client_name || "(senza cliente)"}</div>
                  <span className={`chip ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{r.address}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(r.intervention_date)} · {operatorName ?? "—"} · {r.total_hours ?? 0} h
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {hasMore && latest.length > 0 && (
        <PaginationLoadMore
          href={buildCursorHref("/admin", searchParams as Record<string, string>, latest[latest.length - 1].intervention_date, latest[latest.length - 1].id)}
          hasMore={hasMore}
        />
      )}

      <div className="grid grid-cols-3 gap-2">
        <Link href="/admin/properties" className="card p-3 text-center text-sm font-medium">Immobili</Link>
        <Link href="/admin/templates" className="card p-3 text-center text-sm font-medium">Template</Link>
        <Link href="/admin/settings" className="card p-3 text-center text-sm font-medium">Impostazioni</Link>
        <Link href="/admin/employees" className="card p-3 text-center text-sm font-medium">Dipendenti</Link>
        <Link href="/admin/photos" className="card p-3 text-center text-sm font-medium">Archivio Foto</Link>
        <Link href="/profile" className="card p-3 text-center text-sm font-medium">Profilo</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
