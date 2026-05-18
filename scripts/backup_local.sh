#!/usr/bin/env bash
set -euo pipefail

timestamp="$(date +"%Y%m%d-%H%M%S")"
backup_root="${BACKUP_DIR:-backups}"
backup_dir="${backup_root}/${timestamp}"

mkdir -p "${backup_dir}"

if [[ -f "data/report_pulizie.db" ]]; then
  cp "data/report_pulizie.db" "${backup_dir}/report_pulizie.db"
fi

if [[ -d "data/uploads" ]]; then
  tar -czf "${backup_dir}/uploads.tar.gz" -C "data" "uploads"
fi

echo "Backup creato in ${backup_dir}"
