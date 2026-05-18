# Report Pulizie - Web App V1

Web app locale per creare, salvare e consultare report pulizie secondo le specifiche Markdown importate da `docs/v1_spec/`.

- Persistenza su SQLite locale o Supabase Postgres
- Report giornaliero mobile-first con bozza e completamento
- Dati intervento, orari, pausa e totale ore automatico
- Checklist attività letta da `docs/v1_spec/04_CHECKLIST_ATTIVITA_V1.md`
- Pacchetti attività modificabili da dashboard admin e salvati su database
- Anomalie lette da `docs/v1_spec/05_ANOMALIE_NOTE_V1.md`
- Procedure operative modificabili da dashboard admin e inizializzate dai piani Markdown in `piani/`
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

## Procedure operative admin

Le procedure disponibili nel form "Nuovo Report" vengono inizializzate dai file `.md` nella cartella `piani/` e poi salvate su database.

Dalla dashboard `/admin`, sezione "Procedure operative", l'admin può:

- creare nuove procedure
- modificare titolo, ordine e passaggi operativi
- attivare o disattivare la visibilità nel form operatore
- sincronizzare eventuali procedure Markdown mancanti

Nel form operatore la procedura compila il campo "Attivita extra / manuali". I pacchetti, invece, selezionano automaticamente attività della checklist.

Formato consigliato:

```md
# Piano Pulizia Uffici

## Attivita svolte

- Svuotamento cestini
- Spolvero superfici
- Lavaggio pavimenti
```

Quando selezioni una procedura nel form, il campo "Attivita extra / manuali" viene compilato automaticamente e resta modificabile prima del salvataggio.

## Pacchetti attività admin

I pacchetti rapidi del form "Nuovo Report" vengono inizializzati dalla checklist V1 al primo avvio e poi salvati su database.

Dalla dashboard `/admin`, sezione "Pacchetti attività", l'admin può:

- creare nuovi pacchetti
- modificare nome, ordine e attività incluse
- attivare o disattivare la visibilità nel form operatore
- sincronizzare eventuali pacchetti base mancanti dalla checklist Markdown

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
- `src/models.py`: modello dati SQLAlchemy
- `src/services/reports.py`: validazioni e generazione PDF
- `src/services/activity_plans.py`: import iniziale procedure da piani Markdown
- `src/services/report_template.py`: lettura template report Markdown
- `src/services/v1_spec.py`: lettura checklist/anomalie dalle specifiche V1
- `docs/v1_spec/`: specifiche Markdown importate dallo zip
- `piani/`: procedure operative Markdown precompilate
- `templates/`: pagine HTML server-rendered
- `static/styles.css`: stile UI
- `tests/test_app.py`: test funzionali base

## Configurazione `.env`

Copia `.env.example` in `.env` e modifica se necessario:

- `APP_PORT`: porta app
- `FLASK_DEBUG`: `1` per debug, `0` per no debug
- `DATABASE_PATH`: path file SQLite
- `DATABASE_URL` / `SUPABASE_DB_URL`: connection string Supabase Postgres
- `SECRET_KEY`: chiave sessione Flask
- `WTF_CSRF_ENABLED`: protezione form POST
- `SESSION_COOKIE_SECURE`: usare `1` quando l'app gira su HTTPS
- `MAX_UPLOAD_MB`: limite massimo upload foto
- `SHOW_DEMO_CREDENTIALS`: mostra/nasconde le credenziali demo nel login

## Produzione con Supabase

1. Crea un progetto Supabase.
2. Copia la connection string Postgres da Supabase.
3. Copia `.env.production.example` in `.env` sul server.
4. Imposta `SUPABASE_DB_URL` o `DATABASE_URL`.
5. Cambia `SECRET_KEY`, password admin e password operatore.
6. Avvia con `gunicorn src.wsgi:app --bind 0.0.0.0:$PORT`.
7. Apri `/admin/diagnostics` e verifica che il database risulti Postgres/Supabase.

Per produzione online usa:

- `FLASK_DEBUG=0`
- `SESSION_COOKIE_SECURE=1`
- `ENABLE_HSTS=1`
- `SHOW_DEMO_CREDENTIALS=0`
- HTTPS attivo sul dominio
- backup configurato sul database Supabase

## Backup Locale

Per installazioni self-hosted con SQLite:

```bash
./scripts/backup_local.sh
```

Il backup locale copia `data/report_pulizie.db` e comprime `data/uploads/` dentro `backups/`.
