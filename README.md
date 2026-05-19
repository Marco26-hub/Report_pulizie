# Daily Cleaning Report

Web app mobile-first per la compilazione di report giornalieri di un'impresa di pulizie.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Storage + RLS)
- pdf-lib (generazione PDF lato server)
- Nodemailer (invio email)
- Telegram Bot API (sendDocument)
- PWA installabile (manifest + service worker)

## Funzionalità

**Dipendente**
- Home mobile con pulsanti grandi: Nuovo Report, Report di oggi, Storico, Profilo
- Creazione report con template precompilato (checklist auto-popolata)
- Form con dati intervento, checklist a sezioni richiudibili, anomalie, note, foto, firme
- Calcolo automatico ore totali (entrata - uscita - pausa)
- Autosave bozza ogni 8s + salvataggio manuale
- Compressione immagini browser-side prima dell'upload
- Firma digitale operatore + cliente (touch/mouse)
- Generazione PDF premium e condivisione via Email / Telegram / WhatsApp
- Stato workflow: bozza → completato → inviato → ricevuto → approvato / contestato

**Admin**
- Dashboard con statistiche giorno (report, ore, pendenti, contestati)
- Filtri: data, operatore, cliente, stato
- Approvazione / contestazione report
- Gestione immobili / clienti
- Gestione template checklist
- Impostazioni: nome azienda, email destinataria, Telegram chat_id

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

Compila `.env.local` con le credenziali Supabase, SMTP e Telegram.

### 2. Database

Nel SQL editor di Supabase, esegui in ordine:

1. `supabase/schema.sql` – tabelle, enum, RLS, helper functions
2. `supabase/seed.sql` – funzioni seed (`seed_default_templates`)

Crea i bucket Storage:

- `report-photos` (privato)
- `report-pdfs` (privato)
- `company-logos` (pubblico, opzionale)

Aggiungi policy Storage che limitano lettura/scrittura ai membri della stessa azienda (path prefix = `company_id/…`).

Crea la prima azienda e admin:

```sql
insert into companies (name, admin_email)
values ('Pulizie SRL', 'admin@example.com')
returning id;

-- crea l'utente da Authentication > Add user
-- poi associa il profilo:
insert into profiles (id, company_id, full_name, role)
values ('<user_id_auth>', '<company_id>', 'Mario Rossi', 'admin');

-- semina i template di default
select seed_default_templates('<company_id>');
```

### 3. Dev

```bash
npm run dev
```

Apri http://localhost:3000

### 4. Telegram Bot

1. Crea bot con [@BotFather](https://t.me/botfather), salva il token in `TELEGRAM_BOT_TOKEN`.
2. Avvia una chat con il bot dall'utente/canale destinatario.
3. Recupera il `chat_id` (es. con `https://api.telegram.org/bot<TOKEN>/getUpdates`).
4. Inseriscilo nelle Impostazioni della web app.

### 5. WhatsApp

Usa la Web Share API quando disponibile; fallback su `wa.me?text=...` con link al PDF. Il PDF è scaricabile dal link condiviso — il browser potrebbe non supportare l'allegato automatico.

## Sicurezza

- **RLS** abilitata su tutte le tabelle: ogni azienda vede solo i propri dati; ogni dipendente solo i propri report.
- Route admin protette via middleware (controllo ruolo `admin`).
- Upload foto firmati con percorso `company_id/report_id/kind/file`.
- API server-side usano cookie di sessione del dipendente; service role solo per operazioni Storage.
- Validazione campi obbligatori prima del completamento report (cliente, indirizzo, orario entrata, firma operatore).

## Mobile / PWA

- Layout mobile-first, pulsanti grandi, sezioni richiudibili, barra di progresso, bottom nav.
- `manifest.webmanifest` + `sw.js` per installazione PWA su iOS/Android.
- Aggiungi icone PNG in `public/icons/icon-192.png` e `public/icons/icon-512.png`.

## Struttura

```
app/
  (app)/              # rotte autenticate
    page.tsx          # home dipendente
    reports/...       # storico + new + detail + edit
    admin/...         # dashboard admin
    profile/...
  api/reports/[id]/   # pdf, send-email, send-telegram, approve, contest
  login/page.tsx
  auth/signout/route.ts
components/           # BottomNav, CollapsibleSection, PhotoUpload, SignaturePad, ServiceWorker
lib/                  # constants, utils, auth, pdf, supabase clients
supabase/             # schema.sql, seed.sql
public/               # manifest, sw, icons
```
