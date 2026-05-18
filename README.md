# Report Pulizie - Web App V1

Web app locale per creare, salvare e consultare report pulizie secondo le specifiche Markdown importate da `docs/v1_spec/`.

- Persisitenza su SQLite
- Report giornaliero mobile-first con bozza e completamento
- Dati intervento, orari, pausa e totale ore automatico
- Checklist attività letta da `docs/v1_spec/04_CHECKLIST_ATTIVITA_V1.md`
- Pacchetti attività modificabili da dashboard admin e salvati in SQLite
- Anomalie lette da `docs/v1_spec/05_ANOMALIE_NOTE_V1.md`
- Attivita svolte lette da piani Markdown in `piani/`
- Template report letto da `templates/report_template.md`
- Foto opzionali con archivio admin locale
- Link video esterno opzionale, senza upload video
- Esportazione PDF del singolo report e CSV elenco report
- Azioni WhatsApp, Telegram ed email con messaggi precompilati
- Login con ruoli admin/operatore
- Dashboard admin con filtri, approvazione/contestazione e log invii
- Diagnostica admin per fallback, interconnessioni e runtime

## Requisiti

- Python 3.10+

## Setup rapido

```bash
./scripts/bootstrap.sh
```

## Avvio applicazione

```bash
source .venv/bin/activate
python -m src.app
```

Poi apri: `http://localhost:5000`

Nel tuo ambiente attuale la preview e attiva su `http://127.0.0.1:5001`.

## Avvio produzione locale/self-hosted

```bash
source .venv/bin/activate
gunicorn src.wsgi:app --bind 0.0.0.0:5001
```

Healthcheck:

```bash
curl http://localhost:5001/healthz
```

## Accessi demo

Utente admin:

- username: `admin`
- password: `admin123`

Utente operatore:

- username: `operatore`
- password: `operatore123`

Gli utenti vengono creati automaticamente al primo avvio se non esistono. Puoi cambiare credenziali e nomi da `.env` prima del primo avvio.

## Esecuzione test

```bash
source .venv/bin/activate
pytest -q
```

## Piani attivita Markdown

I piani disponibili nel form "Nuovo Report" sono letti dai file `.md` nella cartella `piani/`.

Formato consigliato:

```md
# Piano Pulizia Uffici

## Attivita svolte

- Svuotamento cestini
- Spolvero superfici
- Lavaggio pavimenti
```

Quando selezioni un piano nel form, il campo "Attivita svolte" viene compilato automaticamente e resta modificabile prima del salvataggio.

## Pacchetti attività admin

I pacchetti rapidi del form "Nuovo Report" vengono inizializzati dalla checklist V1 al primo avvio e poi salvati in SQLite.

Dalla dashboard `/admin`, sezione "Pacchetti attività", l'admin può:

- creare nuovi pacchetti
- modificare nome, ordine e attività incluse
- attivare o disattivare la visibilità nel form operatore

Le attività vanno inserite una per riga. I pacchetti vuoti vengono disattivati automaticamente per evitare selezioni senza effetto nel form operatore.

## Template report Markdown

Il dettaglio report e il PDF leggono l'ordine dei campi da `templates/report_template.md`.

Campi supportati:

- `Data intervento`
- `Sede`
- `Operatore`
- `Cliente / struttura`
- `Indirizzo`
- `Tipologia immobile`
- `Orario entrata`
- `Orario uscita`
- `Pausa`
- `Totale ore`
- `Attivita svolte` / `Attività svolte`
- `Anomalie`
- `Note`
- `Note anomalia`
- `Link video esterno`
- `Descrizione video`
- `Firma`

## Pagine principali

- `/reports/new`: nuovo report
- `/`: elenco report
- `/admin`: dashboard admin
- `/admin/diagnostics`: diagnostica fallback/interconnessioni
- `/admin/photos`: archivio foto
- `/reports/export.csv`: export CSV compatibile con Excel
- `/login`: login admin/operatore
- `/healthz`: stato applicazione

## Struttura progetto

- `src/app.py`: entrypoint Flask e route
- `src/models.py`: modello dati SQLite
- `src/services/reports.py`: validazioni e generazione PDF
- `src/services/activity_plans.py`: lettura piani Markdown
- `src/services/report_template.py`: lettura template report Markdown
- `src/services/v1_spec.py`: lettura checklist/anomalie dalle specifiche V1
- `docs/v1_spec/`: specifiche Markdown importate dallo zip
- `piani/`: piani attivita precompilati
- `templates/`: pagine HTML server-rendered
- `static/styles.css`: stile UI
- `tests/test_app.py`: test funzionali base

## Configurazione `.env`

Copia `.env.example` in `.env` e modifica se necessario:

- `APP_PORT`: porta app
- `FLASK_DEBUG`: `1` per debug, `0` per no debug
- `DATABASE_PATH`: path file SQLite
- `SECRET_KEY`: chiave sessione Flask
