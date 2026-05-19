import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { STATUS_COLORS, STATUS_LABELS, ReportStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { PaginationLoadMore, buildCursorHref } from "@/components/PaginationLoadMore";

const PAGE_SIZE = 25;

export default async function ReportsList({
  searchParams
}: {
  searchParams: { date?: string; status?: string; cursor_date?: string; cursor_id?: string };
}) {
  const { profile, sb } = await requireUser();
  let query = sb
    .from("reports")
    .select("id, intervention_date, client_name, address, status, total_hours")
    .order("intervention_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (profile.role !== "admin") query = query.eq("operator_id", profile.id);
  if (searchParams.date) query = query.eq("intervention_date", searchParams.date);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.cursor_date && searchParams.cursor_id) {
    query = query.or(
      `intervention_date.lt.${searchParams.cursor_date},and(intervention_date.eq.${searchParams.cursor_date},id.lt.${searchParams.cursor_id})`
    );
  }

  const { data: raw } = await query;
  const hasMore = (raw?.length ?? 0) > PAGE_SIZE;
  const reports = raw?.slice(0, PAGE_SIZE) ?? [];

  const filterParams: Record<string, string> = {};
  if (searchParams.date) filterParams.date = searchParams.date;
  if (searchParams.status) filterParams.status = searchParams.status;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Storico Report</h1>
        <Link href="/reports/new" className="btn-primary text-sm">+ Nuovo</Link>
      </div>
      {reports.length === 0 && (
        <div className="card p-6 text-center text-gray-500">Nessun report trovato.</div>
      )}
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id}>
            <Link href={`/reports/${r.id}`} className="card p-3 block">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.client_name}</div>
                <span className={`chip ${STATUS_COLORS[r.status as ReportStatus]}`}>
                  {STATUS_LABELS[r.status as ReportStatus]}
                </span>
              </div>
              <div className="text-sm text-gray-600">{r.address}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(r.intervention_date)} · {r.total_hours ?? 0} h
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <PaginationLoadMore
          href={buildCursorHref("/reports", filterParams, reports[reports.length - 1].intervention_date, reports[reports.length - 1].id)}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
