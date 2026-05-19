import type { PropertyType, ReportStatus, PhotoKind } from "./constants";

export type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  admin_email: string | null;
  telegram_chat_id: string | null;
  manager_whatsapp_number: string | null;
  company_whatsapp_number: string | null;
  default_send_channel: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Profile = {
  id: string;
  company_id: string;
  full_name: string;
  role: "employee" | "admin";
  phone: string | null;
  whatsapp_number: string | null;
  telegram_username: string | null;
  can_send_whatsapp: boolean | null;
  can_send_telegram: boolean | null;
  can_send_email: boolean | null;
  created_at: string;
  updated_at: string | null;
};

export type Report = {
  id: string;
  company_id: string;
  operator_id: string;
  property_id: string | null;
  client_name: string;
  address: string;
  property_type: PropertyType;
  intervention_date: string;
  time_in: string;
  time_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  notes: string | null;
  status: ReportStatus;
  template_id: string | null;
  pdf_url: string | null;
  approved_by: string | null;
  approved_at: string | null;
  contested_reason: string | null;
  external_video_link: string | null;
  external_video_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportTask = {
  id: string;
  report_id: string;
  section: string;
  label: string;
  done: boolean;
  sort_order: number;
};

export type ReportAnomaly = {
  id: string;
  report_id: string;
  code: string;
  detail: string | null;
};

export type ReportPhoto = {
  id: string;
  report_id: string;
  kind: PhotoKind;
  storage_path: string;
  notes: string | null;
  file_name: string | null;
  file_size: number | null;
  operator_id: string | null;
  created_at: string;
};

export type ReportSignature = {
  id: string;
  report_id: string;
  kind: "operator" | "client";
  data_url: string;
  signed_at: string;
};

export type ReportSend = {
  id: string;
  report_id: string;
  channel: "email" | "telegram" | "whatsapp";
  target: string | null;
  success: boolean;
  error: string | null;
  status: string | null;
  sent_by: string | null;
  sent_at: string;
};

export type Property = {
  id: string;
  company_id: string;
  client_name: string;
  address: string;
  property_type: PropertyType;
  notes: string | null;
  created_at: string;
};

export type ReportTemplate = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
};

export type TemplateTask = {
  id: string;
  template_id: string;
  section: string;
  label: string;
  sort_order: number;
};

export type ReportWithOperator = Report & {
  operator: { full_name: string } | null;
};
