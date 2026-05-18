from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


PLAN_DIR_NAMES = ("piani", "plans")
ACTIVITY_HEADING_RE = re.compile(r"^#{1,6}\s+.*attivit[aà].*svolt", re.IGNORECASE)
ANY_HEADING_RE = re.compile(r"^#{1,6}\s+")
BULLET_RE = re.compile(r"^\s*[-*]\s+(.+?)\s*$")
IGNORED_LABELS = {"data", "sede", "operatore", "note", "firma"}


@dataclass(frozen=True)
class ActivityPlan:
    id: str
    title: str
    activities: str
    source: str


def _slug_from_path(path: Path) -> str:
    return re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")


def _extract_title(lines: list[str], path: Path) -> str:
    for line in lines:
        if line.startswith("# "):
            return line[2:].strip()
    return path.stem.replace("_", " ").replace("-", " ").title()


def _extract_bullets(lines: list[str]) -> list[str]:
    bullets: list[str] = []
    in_activity_section = False
    found_activity_heading = False

    for line in lines:
        if ACTIVITY_HEADING_RE.match(line):
            in_activity_section = True
            found_activity_heading = True
            continue

        if found_activity_heading and in_activity_section and ANY_HEADING_RE.match(line):
            break

        if not found_activity_heading:
            in_activity_section = True

        if in_activity_section:
            bullet_match = BULLET_RE.match(line)
            if not bullet_match:
                continue

            value = bullet_match.group(1).strip()
            label = value.split(":", 1)[0].strip().lower()
            if label in IGNORED_LABELS:
                continue
            bullets.append(value)

    return bullets


def load_activity_plans(base_dir: Path) -> list[ActivityPlan]:
    plans: list[ActivityPlan] = []

    for directory_name in PLAN_DIR_NAMES:
        plan_dir = base_dir / directory_name
        if not plan_dir.exists():
            continue

        for path in sorted(plan_dir.glob("*.md")):
            lines = path.read_text(encoding="utf-8").splitlines()
            bullets = _extract_bullets(lines)
            if not bullets:
                continue

            plans.append(
                ActivityPlan(
                    id=_slug_from_path(path),
                    title=_extract_title(lines, path),
                    activities="\n".join(f"- {bullet}" for bullet in bullets),
                    source=str(path.relative_to(base_dir)),
                )
            )

    return plans
