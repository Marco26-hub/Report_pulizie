-- Migration V1: add missing columns and constraints
-- Run after schema.sql in Supabase SQL editor

-- companies: WhatsApp + default channel
alter table companies add column if not exists manager_whatsapp_number text;
alter table companies add column if not exists company_whatsapp_number text;
alter table companies add column if not exists default_send_channel text default 'whatsapp'
  check (default_send_channel in ('whatsapp','telegram','email'));
alter table companies add column if not exists updated_at timestamptz default now();

-- profiles: contact + channel permissions
alter table profiles add column if not exists whatsapp_number text;
alter table profiles add column if not exists telegram_username text;
alter table profiles add column if not exists can_send_whatsapp boolean default true;
alter table profiles add column if not exists can_send_telegram boolean default true;
alter table profiles add column if not exists can_send_email boolean default true;
alter table profiles add column if not exists updated_at timestamptz default now();

-- reports: video link
alter table reports add column if not exists external_video_link text;
alter table reports add column if not exists external_video_description text;

-- report_photos: metadata + new categories
alter table report_photos add column if not exists notes text;
alter table report_photos add column if not exists file_name text;
alter table report_photos add column if not exists file_size integer;
alter table report_photos add column if not exists operator_id uuid references profiles(id) on delete set null;

-- Widen kind check to include new categories
alter table report_photos drop constraint if exists report_photos_kind_check;
alter table report_photos add constraint report_photos_kind_check
  check (kind in ('before','after','anomaly','damage','not_accessible','other'));

-- report_sends: add status + sent_at if missing
alter table report_sends add column if not exists status text default 'sent'
  check (status in ('pending','sent','failed'));
alter table report_sends add column if not exists sent_at timestamptz default now();

-- RLS: profiles update - allow employee to update own row
drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = auth.uid() or (auth_is_admin() and company_id = auth_company_id()))
  with check (id = auth.uid() or (auth_is_admin() and company_id = auth_company_id()));
