export const PROPERTY_TYPES = [
  { value: "appartamento", label: "Appartamento" },
  { value: "villa", label: "Villa" },
  { value: "ufficio", label: "Ufficio" },
  { value: "bnb", label: "B&B" },
  { value: "casa_vacanza", label: "Casa vacanza" },
  { value: "condominio", label: "Condominio" },
  { value: "negozio", label: "Negozio" },
  { value: "studio", label: "Studio professionale" },
  { value: "altro", label: "Altro" }
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export const REPORT_STATUSES = [
  "bozza",
  "completato",
  "inviato",
  "ricevuto",
  "approvato",
  "contestato"
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const STATUS_LABELS: Record<ReportStatus, string> = {
  bozza: "Bozza",
  completato: "Completato",
  inviato: "Inviato",
  ricevuto: "Ricevuto",
  approvato: "Approvato",
  contestato: "Contestato"
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  bozza: "bg-gray-200 text-gray-700",
  completato: "bg-blue-100 text-blue-700",
  inviato: "bg-indigo-100 text-indigo-700",
  ricevuto: "bg-purple-100 text-purple-700",
  approvato: "bg-green-100 text-green-700",
  contestato: "bg-red-100 text-red-700"
};

export const ANOMALY_CODES = [
  { code: "none", label: "Nessuna anomalia" },
  { code: "molto_sporca", label: "Casa trovata molto sporca" },
  { code: "peli_animali", label: "Presenza eccessiva di peli animali" },
  { code: "capelli", label: "Presenza eccessiva di capelli" },
  { code: "mancanza_prodotti", label: "Mancanza prodotti/materiali" },
  { code: "oggetti_rotti", label: "Oggetti rotti già presenti" },
  { code: "zone_non_accessibili", label: "Zone non accessibili" },
  { code: "lenzuola_non_disponibili", label: "Lenzuola pulite non disponibili" },
  { code: "letto_non_rifatto", label: "Letto non rifatto per mancanza biancheria" },
  { code: "bagno_critico", label: "Bagno in condizioni critiche" },
  { code: "cucina_critica", label: "Cucina in condizioni critiche" },
  { code: "tempo_insufficiente", label: "Tempo insufficiente per completare tutto" },
  { code: "altro", label: "Altro" }
] as const;

export const PHOTO_KINDS = [
  { value: "before", label: "Prima" },
  { value: "after", label: "Dopo" },
  { value: "anomaly", label: "Anomalia" },
  { value: "damage", label: "Danno già presente" },
  { value: "not_accessible", label: "Zona non accessibile" },
  { value: "other", label: "Altro" }
] as const;

export type PhotoKind = (typeof PHOTO_KINDS)[number]["value"];

export const CHECKLIST_SECTIONS = [
  "Pulizia generale",
  "Cucina",
  "Bagni",
  "Camere",
  "Soggiorno/living",
  "Vetri e infissi",
  "Zone alte e sicurezza",
  "Esterni"
] as const;
