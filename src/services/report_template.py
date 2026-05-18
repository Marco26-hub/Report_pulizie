from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


FIELD_ALIASES = {
    "data": "data",
    "data intervento": "data",
    "sede": "sede",
    "operatore": "operatore",
    "cliente / struttura": "cliente",
    "cliente": "cliente",
    "indirizzo": "indirizzo",
    "tipologia immobile": "tipologia_immobile",
    "orario entrata": "orario_entrata",
    "orario uscita": "orario_uscita",
    "pausa": "pausa_minuti",
    "totale ore": "totale_ore",
    "attivita svolte": "attivita_svolte",
    "attività svolte": "attivita_svolte",
    "anomalie": "anomalie",
    "note": "note",
    "note anomalia": "note_anomalia",
    "link video esterno": "external_video_link",
    "descrizione video": "external_video_description",
    "firma": "firma",
}


@dataclass(frozen=True)
class ReportTemplateField:
    label: str
    key: str


def _normalize_label(label: str) -> str:
    return label.strip().rstrip(":").lower()


def load_report_template_fields(base_dir: Path) -> list[ReportTemplateField]:
    template_path = base_dir / "templates" / "report_template.md"
    if not template_path.exists():
        return _default_fields()

    fields: list[ReportTemplateField] = []
    for line in template_path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\s*[-*]\s+(.+?)\s*$", line)
        if not match:
            continue

        label = match.group(1).strip().rstrip(":")
        key = FIELD_ALIASES.get(_normalize_label(label))
        if key:
            fields.append(ReportTemplateField(label=label, key=key))

    return fields or _default_fields()


def report_to_template_rows(report: Any, fields: list[ReportTemplateField]) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for field in fields:
        value = getattr(report, field.key, "") or ""
        if field.key == "data" and value:
            value = value.strftime("%Y-%m-%d")
        if field.key == "pausa_minuti":
            value = f"{value} minuti"
        if field.key == "totale_ore":
            value = f"{value:.2f} ore" if isinstance(value, float) else f"{value} ore"
        rows.append((field.label, str(value) or "-"))
    return rows


def _default_fields() -> list[ReportTemplateField]:
    return [
        ReportTemplateField("Data", "data"),
        ReportTemplateField("Sede", "sede"),
        ReportTemplateField("Operatore", "operatore"),
        ReportTemplateField("Attivita svolte", "attivita_svolte"),
        ReportTemplateField("Note", "note"),
        ReportTemplateField("Firma", "firma"),
    ]
