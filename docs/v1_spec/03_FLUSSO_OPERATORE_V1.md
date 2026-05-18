# Flusso Operatore — V1

## Home operatore

Mostrare solo:

- Nuovo Report
- Report di oggi
- Storico Report
- Profilo

## Nuovo report

Step consigliati:

1. Dati intervento
2. Orari
3. Checklist attività
4. Anomalie e note
5. Foto opzionali
6. Link video esterno opzionale
7. Anteprima report
8. Genera PDF / invia

## Dati intervento

Campi:

- Data intervento
- Cliente / struttura
- Indirizzo
- Tipologia immobile

L’operatore seleziona un immobile già esistente.

## Orari

Campi:

- Orario entrata
- Orario uscita
- Pausa eventuale in minuti
- Totale ore automatico

Regole:

- Bozza consentita anche senza orari completi
- Completamento bloccato se mancano orari
- Uscita precedente a entrata bloccata
- Pausa non può essere negativa
- Totale ore non può essere negativo

## Autosave

Implementare autosave bozza.

Mostrare indicatore:

- Salvato
- Salvataggio...
- Errore salvataggio

## Completamento report

Il report può essere completato se:

- Ha data
- Ha operatore
- Ha immobile/cliente
- Ha orario entrata
- Ha orario uscita
- Ha totale ore valido

Foto e link video non sono obbligatori.

## Azioni finali

Dopo completamento:

- Genera PDF
- Scarica PDF
- Stampa PDF
- Condividi via WhatsApp
- Invia via Telegram
- Invia via Email
