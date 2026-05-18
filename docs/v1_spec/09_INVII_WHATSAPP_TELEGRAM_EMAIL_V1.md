# Invii WhatsApp, Telegram, Email — V1

## Pulsanti dopo generazione PDF

Mostrare:

- Scarica PDF
- Stampa PDF
- Condividi via WhatsApp
- Invia via Telegram
- Invia via Email

L’operatore deve vedere solo i canali abilitati dall’admin.

## WhatsApp V1

Non usare WhatsApp Business API.

Usare:

- WhatsApp link
- Web Share API, se disponibile
- Messaggio precompilato

Il messaggio deve includere:

- Operatore
- Cliente / struttura
- Data
- Orario entrata / uscita
- Totale ore
- Link video, solo se presente
- Testo “PDF report allegato”, se PDF generato

Esempio:

Ciao, ti invio il report della pulizia effettuata oggi.

Operatore: [Nome operatore]
Cliente: [Cliente]
Data: [Data]
Orario: [Entrata] - [Uscita]
Totale ore: [Totale]

Link video:
[external_video_link]

PDF report allegato.

Se non c’è link video, non mostrare la sezione link video.

Nota:

Nella V1 il PDF può essere scaricato e allegato manualmente se il browser non supporta la condivisione file automatica.

## Telegram V1

Se configurati:

- telegram_bot_token
- telegram_chat_id

Inviare:

- Messaggio riepilogo
- PDF allegato
- Link video, solo se presente

Se Telegram non è configurato:

- Mostrare “Copia messaggio Telegram”
- Oppure “Apri Telegram”

## Email V1

Inviare email al responsabile configurato.

Oggetto:

Report pulizia - [Cliente] - [Data]

Corpo:

Buongiorno,

in allegato il report della pulizia effettuata.

Operatore: [Nome operatore]
Cliente / struttura: [Cliente]
Data: [Data]
Orario: [Entrata] - [Uscita]
Totale ore: [Totale]

Link video:
[external_video_link]

Cordiali saluti.

Se non c’è link video, non mostrare la riga Link video.

## Log invii

Ogni invio deve essere registrato in `report_sends`.
