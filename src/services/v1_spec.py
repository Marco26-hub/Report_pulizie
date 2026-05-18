from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ChecklistSection:
    title: str
    items: list[str]


@dataclass(frozen=True)
class QuickTemplate:
    name: str
    activities: list[str]


IMMOBILE_TYPES = [
    "Appartamento",
    "Villa",
    "Ufficio",
    "B&B",
    "Casa vacanza",
    "Condominio",
    "Negozio",
    "Studio professionale",
    "Altro",
]

PHOTO_CATEGORIES = [
    "Prima",
    "Dopo",
    "Anomalia",
    "Danno gia presente",
    "Zona non accessibile",
    "Altro",
]

REPORT_STATUSES = ["Bozza", "Completato", "Inviato", "Ricevuto", "Approvato", "Contestato"]

QUICK_TEMPLATE_NAMES = [
    "Appartamento standard",
    "Villa completa",
    "B&B check-in/check-out",
    "Pulizia ordinaria",
    "Pulizia profonda",
    "Pulizia post cantiere",
    "Ufficio",
    "Personalizzato",
]


def load_checklist_sections(base_dir: Path) -> list[ChecklistSection]:
    path = base_dir / "docs" / "v1_spec" / "04_CHECKLIST_ATTIVITA_V1.md"
    sections: list[ChecklistSection] = []
    current_title: str | None = None
    current_items: list[str] = []

    for line in path.read_text(encoding="utf-8").splitlines():
        heading = re.match(r"^##\s+(.+)$", line)
        if heading:
            if current_title and current_items:
                sections.append(ChecklistSection(current_title, current_items))
            current_title = heading.group(1).strip()
            current_items = []
            continue

        bullet = re.match(r"^\s*-\s+(.+)$", line)
        if bullet and current_title and current_title != "Template rapidi":
            current_items.append(bullet.group(1).strip())

    if current_title and current_items:
        sections.append(ChecklistSection(current_title, current_items))

    return sections


def load_anomalies(base_dir: Path) -> list[str]:
    path = base_dir / "docs" / "v1_spec" / "05_ANOMALIE_NOTE_V1.md"
    anomalies: list[str] = []
    in_options = False

    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## Sezione anomalie"):
            in_options = True
            continue
        if in_options and line.startswith("## "):
            break
        bullet = re.match(r"^\s*-\s+(.+)$", line)
        if bullet:
            anomalies.append(bullet.group(1).strip())

    return anomalies


def build_quick_templates(sections: list[ChecklistSection]) -> list[QuickTemplate]:
    by_section = {section.title: section.items for section in sections}

    def pick(*section_names: str, limit: int | None = None) -> list[str]:
        items: list[str] = []
        for section_name in section_names:
            items.extend(by_section.get(section_name, []))
        return items[:limit] if limit else items

    return [
        QuickTemplate("Appartamento standard", pick("Pulizia generale", "Bagni", "Camere", "Cucina", limit=18)),
        QuickTemplate("Villa completa", pick("Pulizia generale", "Cucina", "Bagni", "Camere", "Soggiorno / Living", "Esterni")),
        QuickTemplate("B&B check-in/check-out", pick("Pulizia generale", "Bagni", "Camere", "Cucina", limit=24)),
        QuickTemplate("Pulizia ordinaria", pick("Pulizia generale", "Bagni", "Cucina", limit=16)),
        QuickTemplate("Pulizia profonda", pick("Pulizia generale", "Cucina", "Bagni", "Camere", "Vetri e infissi")),
        QuickTemplate("Pulizia post cantiere", pick("Pulizia generale", "Vetri e infissi", "Zone alte e sicurezza")),
        QuickTemplate("Ufficio", pick("Pulizia generale", "Bagni", "Vetri e infissi", limit=18)),
        QuickTemplate("Personalizzato", []),
    ]
