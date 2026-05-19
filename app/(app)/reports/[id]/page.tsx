import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { STATUS_COLORS, STATUS_LABELS, ReportStatus, PROPERTY_TYPES, ANOMALY_CODES, PHOTO_KINDS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import ReportActions from "./ReportActions";

export default async function ReportDetail({ params }: { params: { id: string } }) {
  const { profile, sb } = await requireUser();
  const { data: report } = await sb
    .from("reports")
    .select("*, operator:profiles!reports_operator_id_fkey(full_name)")
    .eq("id", params.id)
    .single();
  if (!report) notFound();

  const { data: company } = await sb.from("companies").select("manager_whatsapp_number").eq("id", profile.company_id).single();

  const [{ data: tasks }, { data: anomalies }, { data: photos }, { data: sends }] = await Promise.all([
    sb.from("report_tasks").select("*").eq("report_id", report.id).order("section").order("sort_order"),
    sb.from("report_anomalies").select("*").eq("report_id", report.id),
    sb.from("report_photos").select("*").eq("report_id", report.id),
    sb.from("report_sends").select("*").eq("report_id", report.id).order("sent_at", { ascending: false })
  ]);

  const photoUrls = await Promise.all((photos ?? []).map(async (p) => {
    const { data } = await sb.storage.from("report-photos").createSignedUrl(p.storage_path, 3600);
    return { ...p, url: data?.signedUrl };
  }));

  const typeLabel = PROPERTY_TYPES.find((p) => p.value === report.property_type)?.label;
  const grouped = (tasks ?? []).reduce<Record<string, typeof tasks>>((acc, t) => {
    (acc[t!.section] ??= [] as any).push(t!);
    return acc;
  }, {});
  const photosByKind = PHOTO_KINDS.map((k) => ({
    ...k,
    items: photoUrls.filter((p) => p.kind === k.value)
  })).filter((g) => g.items.length > 0);

  const reportForActions = {
    ...report,
    company_whatsapp: company?.manager_whatsapp_number
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{report.client_name}</h1>
          <span className={`chip ${STATUS_COLORS[report.status as ReportStatus]}`}>
            {STATUS_LABELS[report.status as ReportStatus]}
          </span>
        </div>
        <div className="text-sm text-gray-600">{report.address}</div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
          <div><span className="text-gray-500">Data:</span> {formatDate(report.intervention_date)}</div>
          <div><span className="text-gray-500">Tipologia:</span> {typeLabel}</div>
          <div><span className="text-gray-500">Operatore:</span> {report.operator?.full_name}</div>
          <div><span className="text-gray-500">Ore totali:</span> {report.total_hours ?? 0}</div>
          <div><span className="text-gray-500">Entrata:</span> {report.time_in?.slice(0, 5)}</div>
          <div><span className="text-gray-500">Uscita:</span> {report.time_out?.slice(0, 5) ?? "—"}</div>
          {report.break_minutes > 0 && (
            <div><span className="text-gray-500">Pausa:</span> {report.break_minutes} min</div>
          )}
        </div>
        {report.status === "bozza" && (
          <Link href={`/reports/${report.id}/edit`} className="btn-secondary mt-3 w-full">Modifica bozza</Link>
        )}
        {report.contested_reason && (
          <div className="mt-2 p-2 rounded-lg bg-red-50 text-sm text-red-700">
            <strong>Contestato:</strong> {report.contested_reason}
          </div>
        )}
      </div>

      <ReportActions reportId={report.id} report={reportForActions} isAdmin={profile.role === "admin"} />

      {Object.entries(grouped).map(([section, items]) => (
        <div key={section} className="card p-3">
          <h3 className="font-semibold mb-2">{section}</h3>
          <ul className="text-sm space-y-1">
            {items!.map((t: any) => (
              <li key={t.id} className={`flex items-center gap-2 ${t.done ? "" : "text-gray-400"}`}>
                <span className="w-4 flex-shrink-0">{t.done ? "✓" : "○"}</span>
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {anomalies && anomalies.length > 0 && (
        <div className="card p-3">
          <h3 className="font-semibold mb-2">Anomalie</h3>
          <ul className="text-sm list-disc pl-5 space-y-1">
            {anomalies.map((a) => {
              const lbl = ANOMALY_CODES.find((x) => x.code === a.code)?.label ?? a.code;
              return <li key={a.id}>{lbl}{a.detail ? ` — ${a.detail}` : ""}</li>;
            })}
          </ul>
        </div>
      )}

      {report.notes && (
        <div className="card p-3">
          <h3 className="font-semibold mb-2">Note operative</h3>
          <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
        </div>
      )}

      {report.external_video_link && (
        <div className="card p-3">
          <h3 className="font-semibold mb-2">Link video</h3>
          <a href={report.external_video_link} target="_blank" rel="noopener noreferrer"
            className="text-sm text-brand-700 underline break-all">
            {report.external_video_link}
          </a>
          {report.external_video_description && (
            <p className="text-xs text-gray-500 mt-1">{report.external_video_description}</p>
          )}
        </div>
      )}

      {photosByKind.length > 0 && (
        <div className="card p-3 space-y-3">
          <h3 className="font-semibold">Foto allegate</h3>
          {photosByKind.map((group) => (
            <div key={group.value}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group.label}</div>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((p: any) => p.url && (
                  <div key={p.id}>
                    <a href={p.url} target="_blank" rel="noopener"
                      className="block aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={p.url} alt={group.label} className="w-full h-full object-cover" />
                    </a>
                    {p.notes && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{p.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {photoUrls.length === 0 && (
        <div className="card p-3 text-sm text-gray-500">Nessuna foto allegata al report.</div>
      )}

      {sends && sends.length > 0 && (
        <div className="card p-3">
          <h3 className="font-semibold mb-2">Log invii</h3>
          <ul className="text-xs space-y-1">
            {sends.map((s: any) => (
              <li key={s.id} className={s.success || s.status === "sent" ? "text-green-700" : "text-red-700"}>
                [{new Date(s.sent_at).toLocaleString("it-IT")}] {s.channel} → {s.target ?? "—"}{" "}
                {(s.success || s.status === "sent") ? "OK" : `ERR ${s.error ?? s.error_message ?? ""}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
