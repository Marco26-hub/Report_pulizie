from __future__ import annotations

import csv
import re
from datetime import date, datetime
from io import BytesIO, StringIO
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


REQUIRED_FIELDS = ("data", "operatore")
MAX_TEXT_LENGTHS = {
    "sede": 120,
    "cliente": 160,
    "indirizzo": 240,
    "operatore": 120,
    "attivita_svolte": 5000,
    "anomalie": 3000,
    "note_anomalia": 3000,
    "note": 5000,
    "firma": 120,
    "external_video_link": 500,
    "external_video_description": 2000,
}
URL_RE = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)


def validate_report_payload(form: dict[str, Any]) -> tuple[dict[str, str], dict[str, Any]]:
    errors: dict[str, str] = {}
    cleaned: dict[str, Any] = {}

    raw_data = (form.get("data") or "").strip()
    raw_cliente = (form.get("cliente") or form.get("sede") or "").strip()
    raw_sede = raw_cliente
    raw_indirizzo = (form.get("indirizzo") or "").strip()
    raw_tipologia = (form.get("tipologia_immobile") or "").strip()
    raw_operatore = (form.get("operatore") or "").strip()
    selected_activities = [item.strip() for item in form.getlist("attivita_checklist") if item.strip()] if hasattr(form, "getlist") else []
    manual_activities = (form.get("attivita_svolte") or "").strip()
    raw_attivita = "\n".join([f"- {item}" for item in selected_activities] + ([manual_activities] if manual_activities else [])).strip()
    raw_anomalie_items = form.getlist("anomalie") if hasattr(form, "getlist") else []
    if "Nessuna anomalia" in raw_anomalie_items and len(raw_anomalie_items) > 1:
        raw_anomalie_items = ["Nessuna anomalia"]
    raw_anomalie = "\n".join(f"- {item}" for item in raw_anomalie_items)
    raw_note_anomalia = (form.get("note_anomalia") or "").strip()
    raw_note = (form.get("note") or "").strip()
    raw_firma = (form.get("firma") or "").strip()
    raw_external_video_link = (form.get("external_video_link") or "").strip()
    raw_external_video_description = (form.get("external_video_description") or "").strip()
    raw_orario_entrata = (form.get("orario_entrata") or "").strip()
    raw_orario_uscita = (form.get("orario_uscita") or "").strip()
    raw_pausa = (form.get("pausa_minuti") or "0").strip()
    requested_status = (form.get("stato") or form.get("submit_action") or "Bozza").strip()
    stato = "Completato" if requested_status.lower() == "completato" else "Bozza"

    field_values = {
        "data": raw_data,
        "sede": raw_sede,
        "cliente": raw_cliente,
        "indirizzo": raw_indirizzo,
        "operatore": raw_operatore,
        "attivita_svolte": raw_attivita,
        "anomalie": raw_anomalie,
        "note_anomalia": raw_note_anomalia,
        "note": raw_note,
        "firma": raw_firma,
        "external_video_link": raw_external_video_link,
        "external_video_description": raw_external_video_description,
    }

    for field in REQUIRED_FIELDS:
        if not field_values[field]:
            errors[field] = "Campo obbligatorio"

    if stato == "Completato":
        for field, message in {
            "cliente": "Cliente / struttura obbligatorio per completare",
            "orario_entrata": "Orario entrata obbligatorio per completare",
            "orario_uscita": "Orario uscita obbligatorio per completare",
            "attivita_svolte": "Seleziona o inserisci almeno una attivita",
        }.items():
            if not (field_values.get(field) or locals().get(f"raw_{field}", "")):
                errors[field] = message

    if raw_data:
        try:
            cleaned["data"] = datetime.strptime(raw_data, "%Y-%m-%d").date()
        except ValueError:
            errors["data"] = "Formato data non valido (YYYY-MM-DD)"
    elif stato == "Bozza":
        cleaned["data"] = date.today()

    try:
        pausa_minuti = int(raw_pausa or "0")
        if pausa_minuti < 0:
            errors["pausa_minuti"] = "La pausa non puo essere negativa"
    except ValueError:
        pausa_minuti = 0
        errors["pausa_minuti"] = "Pausa non valida"

    totale_ore = 0.0
    if raw_orario_entrata and raw_orario_uscita:
        try:
            entrata = datetime.strptime(raw_orario_entrata, "%H:%M")
            uscita = datetime.strptime(raw_orario_uscita, "%H:%M")
            minutes = int((uscita - entrata).total_seconds() / 60) - pausa_minuti
            if minutes < 0:
                errors["orario_uscita"] = "Orario uscita precedente a entrata o pausa eccessiva"
            else:
                totale_ore = round(minutes / 60, 2)
        except ValueError:
            errors["orari"] = "Formato orari non valido"

    if raw_external_video_link and not URL_RE.match(raw_external_video_link):
        errors["external_video_link"] = "Inserisci un URL valido che inizi con http:// o https://"

    for field, max_len in MAX_TEXT_LENGTHS.items():
        value = field_values[field]
        if value and len(value) > max_len:
            errors[field] = f"Lunghezza massima superata ({max_len} caratteri)"

    cleaned.update(
        {
            "sede": raw_sede or raw_cliente or "Bozza",
            "cliente": raw_cliente,
            "indirizzo": raw_indirizzo,
            "tipologia_immobile": raw_tipologia,
            "operatore": raw_operatore,
            "orario_entrata": raw_orario_entrata,
            "orario_uscita": raw_orario_uscita,
            "pausa_minuti": pausa_minuti,
            "totale_ore": totale_ore,
            "attivita_svolte": raw_attivita,
            "anomalie": raw_anomalie,
            "note_anomalia": raw_note_anomalia,
            "note": raw_note,
            "firma": raw_firma,
            "external_video_link": raw_external_video_link,
            "external_video_description": raw_external_video_description,
            "stato": stato,
        }
    )

    return errors, cleaned


def generate_report_pdf(report: dict[str, Any], rows: list[tuple[str, str]] | None = None) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Report Pulizia Giornaliero", styles["Title"]))
    story.append(Spacer(1, 16))

    if rows is None:
        rows = [
            ("Data", report["data"]),
            ("Sede", report["sede"]),
            ("Operatore", report["operatore"]),
            ("Attivita svolte", report["attivita_svolte"]),
            ("Note", report["note"] or "-"),
            ("Firma", report["firma"] or "-"),
            ("Creato il", report["created_at"]),
        ]

    for label, value in rows:
        safe_value = str(value).replace("\n", "<br/>")
        story.append(Paragraph(f"<b>{label}:</b> {safe_value}", styles["BodyText"]))
        story.append(Spacer(1, 10))

    doc.build(story)
    return buffer.getvalue()


def generate_reports_csv(reports: list[Any]) -> bytes:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Data",
            "Cliente",
            "Indirizzo",
            "Tipologia",
            "Operatore",
            "Entrata",
            "Uscita",
            "Pausa",
            "Totale ore",
            "Stato",
            "Attivita svolte",
            "Anomalie",
            "Note",
            "Link video",
            "Firma",
            "Creato il",
        ]
    )

    for report in reports:
        writer.writerow(
            [
                report.id,
                report.data.strftime("%Y-%m-%d"),
                report.cliente or report.sede,
                report.indirizzo or "",
                report.tipologia_immobile or "",
                report.operatore,
                report.orario_entrata or "",
                report.orario_uscita or "",
                report.pausa_minuti or 0,
                report.totale_ore or 0,
                report.stato,
                report.attivita_svolte,
                report.anomalie or "",
                report.note or "",
                report.external_video_link or "",
                report.firma or "",
                report.created_at.strftime("%Y-%m-%d %H:%M"),
            ]
        )

    return output.getvalue().encode("utf-8-sig")
