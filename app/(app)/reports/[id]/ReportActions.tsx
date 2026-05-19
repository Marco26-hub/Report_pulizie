"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Download, Printer, Mail, Send, Share2, CheckCircle, XCircle, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { Report } from "@/lib/database.types";

type ReportWithCompany = Report & { company_whatsapp?: string | null; operator?: { full_name: string } | null };

export default function ReportActions({ reportId, report, isAdmin }:
  { reportId: string; report: ReportWithCompany; isAdmin: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const status = report.status;

  async function generatePdf(): Promise<string | null> {
    const res = await fetch(`/api/reports/${reportId}/pdf`, { method: "POST" });
    if (!res.ok) { toast.error("Errore generazione PDF"); return null; }
    const { url } = await res.json();
    return url;
  }

  async function download() {
    setBusy("pdf");
    const url = await generatePdf();
    setBusy(null);
    if (url) {
      const a = document.createElement("a");
      const client = report.client_name?.replace(/\s+/g, "-").toLowerCase() ?? "report";
      const date = report.intervention_date ?? "";
      a.download = `report-pulizia-${client}-${date}.pdf`;
      a.href = url;
      a.click();
    }
  }

  async function print() {
    setBusy("print");
    const url = await generatePdf();
    setBusy(null);
    if (url) { const w = window.open(url, "_blank"); w?.addEventListener("load", () => w.print()); }
  }

  async function sendEmail() {
    setBusy("email");
    const res = await fetch(`/api/reports/${reportId}/send-email`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.error === "admin_email_not_set") return toast.error("Email responsabile non configurata nelle impostazioni");
      return toast.error("Errore invio email");
    }
    toast.success("Email inviata");
    router.refresh();
  }

  async function sendTelegram() {
    setBusy("tg");
    const res = await fetch(`/api/reports/${reportId}/send-telegram`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.error === "telegram_not_configured") {
        const msg = buildTelegramMessage();
        await navigator.clipboard.writeText(msg).catch(() => {});
        toast("Telegram non configurato. Messaggio copiato negli appunti!", { icon: "📋", duration: 5000 });
        return;
      }
      return toast.error("Errore invio Telegram");
    }
    toast.success("Inviato su Telegram");
    router.refresh();
  }

  function buildWhatsappMessage(pdfUrl?: string): string {
    const lines = [
      "Ciao, ti invio il report della pulizia effettuata.",
      "",
      `Operatore: ${report.operator?.full_name ?? "—"}`,
      `Cliente: ${report.client_name ?? "—"}`,
      `Data: ${report.intervention_date ? formatDate(report.intervention_date) : "—"}`,
      `Orario: ${report.time_in?.slice(0, 5) ?? "—"} - ${report.time_out?.slice(0, 5) ?? "—"}`,
      `Totale ore: ${report.total_hours ?? 0}`
    ];
    if (report.external_video_link) {
      lines.push("", `Link video:\n${report.external_video_link}`);
    }
    if (pdfUrl) lines.push("", "PDF report allegato.");
    return lines.join("\n");
  }

  function buildTelegramMessage(): string {
    const lines = [
      "📋 Nuovo report pulizia ricevuto",
      "",
      `Operatore: ${report.operator?.full_name ?? "—"}`,
      `Cliente: ${report.client_name ?? "—"}`,
      `Data: ${report.intervention_date ? formatDate(report.intervention_date) : "—"}`,
      `Orario: ${report.time_in?.slice(0, 5) ?? "—"} - ${report.time_out?.slice(0, 5) ?? "—"}`,
      `Totale ore: ${report.total_hours ?? 0}`
    ];
    if (report.external_video_link) {
      lines.push("", `Link video:\n${report.external_video_link}`);
    }
    return lines.join("\n");
  }

  async function shareWhatsapp() {
    setBusy("wa");
    const url = await generatePdf();
    setBusy(null);
    const msgText = buildWhatsappMessage(url ?? undefined);

    if (navigator.share && url) {
      try {
        await navigator.share({ title: "Report Pulizia", text: msgText, url });
        return;
      } catch { /* user cancelled */ }
    }

    // fallback: wa.me link
    const waNumber = report.company_whatsapp ?? "";
    const encoded = encodeURIComponent(msgText + (url ? `\n${url}` : ""));
    const waUrl = waNumber
      ? `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");
    if (!url) toast("Genera il PDF prima e allegalo manualmente.", { icon: "ℹ️" });
  }

  async function copyTelegramMessage() {
    const msg = buildTelegramMessage();
    await navigator.clipboard.writeText(msg).catch(() => {});
    toast.success("Messaggio Telegram copiato");
  }

  async function adminAction(action: "approve" | "contest") {
    let reason: string | null = null;
    if (action === "contest") {
      reason = window.prompt("Motivo contestazione:");
      if (!reason) return;
    }
    setBusy(action);
    const res = await fetch(`/api/reports/${reportId}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason })
    });
    setBusy(null);
    if (!res.ok) return toast.error("Errore");
    toast.success(action === "approve" ? "Approvato ✓" : "Contestato");
    router.refresh();
  }

  if (status === "bozza") return null;

  return (
    <div className="card p-3 space-y-3">
      <h3 className="font-semibold">Azioni</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={download} disabled={!!busy} className="btn-secondary text-sm">
          <Download size={15} className="mr-1.5" />{busy === "pdf" ? "…" : "Scarica PDF"}
        </button>
        <button onClick={print} disabled={!!busy} className="btn-secondary text-sm">
          <Printer size={15} className="mr-1.5" />{busy === "print" ? "…" : "Stampa"}
        </button>
        <button onClick={sendEmail} disabled={!!busy} className="btn-secondary text-sm">
          <Mail size={15} className="mr-1.5" />{busy === "email" ? "Invio…" : "Email"}
        </button>
        <button onClick={sendTelegram} disabled={!!busy} className="btn-secondary text-sm">
          <Send size={15} className="mr-1.5" />{busy === "tg" ? "Invio…" : "Telegram"}
        </button>
        <button onClick={shareWhatsapp} disabled={!!busy} className="btn-secondary text-sm col-span-2">
          <Share2 size={15} className="mr-1.5" />{busy === "wa" ? "Preparazione…" : "WhatsApp"}
        </button>
        <button onClick={copyTelegramMessage} className="btn-secondary text-sm col-span-2">
          <Copy size={15} className="mr-1.5" />Copia messaggio Telegram
        </button>
      </div>
      {isAdmin && status !== "approvato" && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <button onClick={() => adminAction("approve")} disabled={!!busy} className="btn-primary">
            <CheckCircle size={16} className="mr-1.5" />Approva
          </button>
          <button onClick={() => adminAction("contest")} disabled={!!busy} className="btn-danger">
            <XCircle size={16} className="mr-1.5" />Contesta
          </button>
        </div>
      )}
    </div>
  );
}
