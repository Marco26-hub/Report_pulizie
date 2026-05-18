# Dashboard Admin, Sicurezza e QA — V1

## Dashboard admin

Mostrare:

- Report di oggi
- Ultimi report
- Report per dipendente
- Report per cliente / immobile
- Totale ore lavorate
- Anomalie segnalate
- Report in attesa approvazione
- Report contestati

## Filtri

- Data
- Dipendente
- Cliente
- Immobile
- Stato
- Presenza anomalie

## Stati report

- Bozza
- Completato
- Inviato
- Ricevuto
- Approvato
- Contestato

## Azioni admin

- Aprire report
- Scaricare PDF
- Approvare report
- Contestare report
- Vedere anomalie
- Aprire archivio foto
- Filtrare foto
- Gestire immobili
- Gestire operatori
- Configurare canali di invio

## Sicurezza produzione

Implementare:

- Supabase Auth
- Row Level Security
- Route protette
- Validazione client
- Validazione server
- Storage protetto
- Permessi per ruolo
- Permessi per company

## Regole RLS

- Ogni company vede solo i propri dati
- Operatore vede solo i propri report
- Admin vede tutti i report della propria company
- Nessun utente vede dati di altre aziende

## Test QA

Verificare:

- Operatore vede solo i propri report
- Admin vede solo report della propria company
- Utente non accede ai dati di altre aziende
- Route admin protette
- Route operatore protette
- RLS attiva
- Report salvabile come bozza
- Completamento bloccato senza dati essenziali
- Uscita precedente a entrata bloccata
- Totale ore corretto
- Report completabile senza foto
- Report completabile senza link video
- Template funzionanti
- Anomalie salvate
- “Nessuna anomalia” esclude le altre
- Foto opzionali
- Upload foto funzionante
- Archivio foto mostra solo foto reali
- Nessun record vuoto se non ci sono foto
- Nessun upload video
- Nessuna tabella video
- Nessun archivio video
- PDF generato correttamente
- WhatsApp apre messaggio precompilato
- Telegram invia o copia messaggio
- Email allega PDF
- report_sends registra invii
- Nessun placeholder visibile
- Nessun bottone morto
- App usabile da smartphone
