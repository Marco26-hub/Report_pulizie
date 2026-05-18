# Link Video Esterno — V1

## Regola fondamentale

Nella V1 non esiste upload video.

Non creare:

- Upload video
- Archivio video
- Tabella video
- Compressione video
- Player video interno
- Storage video
- Anteprima video

## Funzione consentita V1

Consentire solo un link video esterno opzionale.

Sezione nel report:

“Link video documentazione”

Campi:

- Vuoi aggiungere un link video? Sì / No
- Link video esterno
- Descrizione video opzionale

## Regole

- Il link video è opzionale
- Il report funziona anche senza link video
- Se inserito, validare formato URL
- Salvare solo la stringa del link
- Non scaricare il video
- Non salvare copie del video
- Non generare anteprime
- Non creare archivio

## Database

Nella tabella `reports` aggiungere:

- external_video_link nullable
- external_video_description nullable

## PDF

Se presente, mostrare:

Link video documentazione: [external_video_link]

Se presente, mostrare anche:

Descrizione video: [external_video_description]

Se non presente, non mostrare la sezione oppure mostrare:

Nessun link video allegato.

## Invii

Il link video deve essere incluso nei messaggi WhatsApp, Telegram ed email solo se presente.
