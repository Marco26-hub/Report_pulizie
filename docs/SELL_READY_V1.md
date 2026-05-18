# Sell-ready V1 checklist

## Stato

Questa versione e pronta per demo commerciale e primo pilota locale/self-hosted.

## Incluso nella V1

- Login admin/operatore
- Operatore limitato ai propri report
- Admin con dashboard, filtri, utenti, log invii e stati report
- Report mobile-first
- Checklist da Markdown
- Foto opzionali e archivio foto admin
- PDF con download forzato
- CSV Excel
- WhatsApp, Telegram ed email con messaggio precompilato
- Healthcheck `/healthz`
- Diagnostica admin `/admin/diagnostics`
- Avvio produzione con `gunicorn`

## Prima di consegnare a un cliente

- Cambiare `SECRET_KEY`
- Cambiare password demo admin/operatore
- Creare gli operatori reali da dashboard admin
- Fare backup periodico di `data/report_pulizie.db` e `data/uploads/`
- Usare HTTPS se pubblicata online

## Fuori dalla V1 locale

- Pagamenti
- Fatture
- WhatsApp Business API
- Upload video
- Supabase Auth/RLS/Storage
- Multi-azienda cloud
