#!/usr/bin/env bash
set -euo pipefail

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp -n .env.example .env || true
python -c "from src.app import create_app; app=create_app(); print('DB inizializzato')"
echo "Setup completato. Avvio: source .venv/bin/activate && python -m src.app"
