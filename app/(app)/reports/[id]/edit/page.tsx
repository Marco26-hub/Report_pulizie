import { requireUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ReportEditor from "./ReportEditor";
import type { Property } from "@/lib/database.types";

export default async function EditReportPage({ params }: { params: { id: string } }) {
  const { profile, sb } = await requireUser();
  const { data: report } = await sb.from("reports").select("*").eq("id", params.id).single();
  if (!report) notFound();
  if (profile.role !== "admin" && report.operator_id !== profile.id) redirect("/reports");
  if (report.status !== "bozza" && profile.role !== "admin") redirect(`/reports/${report.id}`);

  const [{ data: tasks }, { data: anomalies }, { data: photos }, { data: signatures }, { data: properties }] = await Promise.all([
    sb.from("report_tasks").select("*").eq("report_id", report.id).order("section").order("sort_order"),
    sb.from("report_anomalies").select("*").eq("report_id", report.id),
    sb.from("report_photos").select("*").eq("report_id", report.id),
    sb.from("report_signatures").select("*").eq("report_id", report.id),
    sb.from("properties").select("id, client_name, address, property_type").eq("company_id", profile.company_id)
  ]);

  // sign photo urls server-side
  const photosWithUrl = await Promise.all((photos ?? []).map(async (p) => {
    const { data } = await sb.storage.from("report-photos").createSignedUrl(p.storage_path, 3600);
    return { ...p, previewUrl: data?.signedUrl };
  }));

  return (
    <ReportEditor
      report={report}
      tasks={tasks ?? []}
      anomalies={anomalies ?? []}
      photos={photosWithUrl}
      signatures={signatures ?? []}
      properties={(properties ?? []) as Pick<Property, "id" | "client_name" | "address" | "property_type">[]}
      companyId={profile.company_id}
      operatorId={profile.id}
    />
  );
}
