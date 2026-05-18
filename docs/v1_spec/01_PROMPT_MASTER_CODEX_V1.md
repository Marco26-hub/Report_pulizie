# Prompt Master per Codex — Daily Cleaning Report V1

Agisci come un senior full-stack engineer.

Crea una web app production-ready chiamata **Daily Cleaning Report V1**.

La web app deve permettere agli operatori di un’impresa di pulizie di compilare rapidamente report giornalieri degli interventi effettuati presso appartamenti, ville, uffici, B&B, case vacanza e altri immobili.

## Regola fondamentale

Sviluppa solo la V1.

Non implementare preventivi.

Non implementare upload video.

Non implementare archivio video.

Non implementare funzioni future.

Il video nella V1 è solo un link esterno opzionale salvato come testo nel report.

## Stack

Usa:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- PDF generation
- Email sending
- Telegram Bot opzionale
- WhatsApp link / Web Share API

## Ruoli

### Operatore

Può:

- Fare login
- Creare report
- Vedere solo i propri report
- Salvare bozze
- Completare report
- Generare PDF
- Scaricare PDF
- Stampare PDF
- Condividere via WhatsApp
- Inviare via Telegram se abilitato
- Inviare via email se abilitato

### Admin / Responsabile

Può:

- Vedere tutti i report della propria azienda
- Filtrare report
- Vedere archivio foto
- Gestire immobili/clienti
- Approvare o contestare report
- Configurare email, WhatsApp e Telegram

## Home operatore

La home deve avere solo:

- Nuovo Report
- Report di oggi
- Storico Report
- Profilo

## Creazione report

Campi obbligatori:

- Data intervento
- Operatore automatico dal login
- Cliente / struttura
- Indirizzo
- Tipologia immobile
- Orario entrata
- Orario uscita
- Pausa eventuale
- Totale ore automatico

Tipologie immobile:

- Appartamento
- Villa
- Ufficio
- B&B
- Casa vacanza
- Condominio
- Negozio
- Studio professionale
- Altro

Calcolo:

Totale ore = Orario uscita - Orario entrata - Pausa

Bloccare completamento se:

- Manca orario entrata
- Manca orario uscita
- Orario uscita precedente a orario entrata

Consentire bozza anche con dati incompleti.

## Checklist attività

Usare sezioni richiudibili mobile-first.

Categorie:

- Pulizia generale
- Cucina
- Bagni
- Camere
- Soggiorno/Living
- Vetri e infissi
- Zone alte e sicurezza
- Esterni

L’operatore deve poter selezionare solo ciò che ha fatto.

## Template rapidi

Creare template iniziali:

- Appartamento standard
- Villa completa
- B&B check-in/check-out
- Pulizia ordinaria
- Pulizia profonda
- Pulizia post cantiere
- Ufficio
- Personalizzato

Quando si seleziona un template, preselezionare le attività più comuni.

L’operatore deve poter modificare manualmente le spunte.

## Anomalie

Opzioni:

- Nessuna anomalia
- Casa trovata molto sporca
- Presenza eccessiva di peli animali
- Presenza eccessiva di capelli
- Mancanza prodotti/materiali
- Oggetti rotti già presenti
- Zone non accessibili
- Lenzuola pulite non disponibili
- Letto non rifatto per mancanza biancheria
- Bagno in condizioni critiche
- Cucina in condizioni critiche
- Tempo insufficiente per completare tutto
- Altro

Regola:

“Nessuna anomalia” deve escludere tutte le altre anomalie.

## Foto

Le foto sono opzionali.

Il report deve poter essere completato anche senza foto.

Aggiungere scelta:

“Vuoi allegare foto al report?”

Opzioni:

- No, nessuna foto
- Sì, allega foto

Categorie foto:

- Prima
- Dopo
- Anomalia
- Danno già presente
- Zona non accessibile
- Altro

Regole:

- Nessuna foto obbligatoria
- Foto prima non obbligatorie
- Foto dopo non obbligatorie
- Supportare fotocamera smartphone
- Supportare galleria
- Supportare JPG, PNG, WEBP
- Compressione immagini prima dell’upload
- Anteprima foto
- Eliminazione foto prima del salvataggio
- Nota opzionale per ogni foto
- Massimo default 10 foto per report
- Salvataggio su Supabase Storage

## Link video esterno opzionale

Nella V1 non fare upload video.

Aggiungere solo:

- Vuoi aggiungere link video? Sì/No
- Link video esterno
- Descrizione video opzionale

Campi database:

- external_video_link nullable
- external_video_description nullable

Validare il link solo se inserito.

Il report deve funzionare anche senza link video.

## PDF premium

Generare PDF professionale con:

- Logo azienda
- Titolo “Report Pulizia Giornaliero”
- Data intervento
- Operatore
- Cliente/struttura
- Indirizzo
- Tipologia immobile
- Orario entrata
- Orario uscita
- Pausa
- Totale ore
- Attività svolte
- Anomalie
- Note operative
- Foto allegate se presenti
- Link video esterno se presente
- Data e ora generazione PDF

Se non ci sono foto, mostrare:

“Nessuna foto allegata al report.”

Nome file:

report-pulizia-[cliente]-[data]-[operatore].pdf

## Invio

Dopo generazione PDF mostrare:

- Scarica PDF
- Stampa PDF
- Condividi via WhatsApp
- Invia via Telegram
- Invia via Email

WhatsApp V1:

- Non usare WhatsApp Business API
- Usare link WhatsApp o Web Share API
- Messaggio precompilato
- PDF allegabile manualmente se il browser non supporta share file

Telegram V1:

- Se bot token e chat ID configurati, inviare messaggio riepilogo + PDF
- Se non configurato, mostrare “Copia messaggio Telegram”

Email V1:

- Inviare email al responsabile
- Allegare PDF
- Inserire link video solo se presente

## Dashboard admin

Mostrare:

- Report di oggi
- Ultimi report
- Report per dipendente
- Report per cliente/immobile
- Totale ore lavorate
- Anomalie segnalate
- Report in attesa approvazione
- Report contestati

Filtri:

- Data
- Dipendente
- Cliente
- Immobile
- Stato
- Presenza anomalie

Stati report:

- Bozza
- Completato
- Inviato
- Ricevuto
- Approvato
- Contestato

## Sicurezza

Implementare:

- Supabase Auth
- Row Level Security
- company_id su ogni tabella
- Operatore vede solo propri report
- Admin vede solo report della propria company
- Storage foto protetto
- Route protette
- Validazione lato client e server

## Obiettivo finale

Una V1 stabile, veloce, mobile-first, pronta per produzione, senza funzioni inutili.
