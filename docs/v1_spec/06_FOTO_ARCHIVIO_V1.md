# Foto e Archivio Foto — V1

## Regola principale

Le foto sono completamente opzionali.

Il report deve poter essere completato anche senza foto.

## Scelta iniziale

Nel report mostrare:

“Vuoi allegare foto al report?”

Opzioni:

- No, nessuna foto
- Sì, allega foto

Se “No”:

- Non mostrare upload foto
- Non bloccare report
- Nel PDF mostrare eventualmente “Nessuna foto allegata al report”

Se “Sì”:

- Mostrare upload foto diviso per categorie

## Categorie foto

- Prima
- Dopo
- Anomalia
- Danno già presente
- Zona non accessibile
- Altro

## Regole

- Nessuna categoria è obbligatoria
- Foto prima non obbligatorie
- Foto dopo non obbligatorie
- Il report può essere completato con zero foto
- Massimo default 10 foto per report
- Supportare JPG, PNG, WEBP
- Upload da fotocamera smartphone
- Upload da galleria
- Compressione immagini prima dell’upload
- Anteprima immagine prima del salvataggio
- Eliminazione foto prima del salvataggio definitivo
- Nota opzionale per ogni foto
- Barra progresso upload
- Messaggio chiaro se foto troppo grande o formato non valido

## Storage

Usare Supabase Storage.

Bucket:

- report-photos

Percorso:

/company_id/reports/report_id/photos/file_name

## Archivio Foto admin

Creare sezione:

Archivio Foto

Funzioni:

- Visualizzare tutte le foto caricate nei report
- Filtrare per data
- Filtrare per operatore
- Filtrare per cliente / struttura
- Filtrare per immobile
- Filtrare per categoria foto
- Cercare per indirizzo, cliente o note
- Aprire report collegato
- Scaricare foto
- Eliminare foto, solo admin

## Card foto

Ogni card foto mostra:

- Miniatura
- Cliente / struttura
- Data
- Operatore
- Categoria
- Pulsante Apri report
- Pulsante Scarica
- Pulsante Elimina, solo admin

## Importante

Se un report non ha foto, non creare record vuoti in `report_photos`.
