# Database Supabase — V1

## Principio

Tutte le tabelle devono usare `company_id`.

Ogni azienda vede solo i propri dati.

## companies

Campi:

- id uuid primary key
- name text not null
- logo_url text nullable
- manager_email text nullable
- manager_whatsapp_number text nullable
- company_whatsapp_number text nullable
- telegram_bot_token text nullable
- telegram_chat_id text nullable
- default_send_channel text nullable
- created_at timestamp default now()
- updated_at timestamp default now()

## profiles

Campi:

- id uuid primary key, references auth.users(id)
- company_id uuid references companies(id)
- full_name text not null
- email text not null
- phone_number text nullable
- whatsapp_number text nullable
- telegram_username text nullable
- role text not null
- can_send_whatsapp boolean default true
- can_send_telegram boolean default false
- can_send_email boolean default true
- created_at timestamp default now()
- updated_at timestamp default now()

Ruoli:

- operator
- admin
- manager

## properties

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- name text not null
- address text not null
- property_type text not null
- mq numeric nullable
- rooms integer nullable
- bathrooms integer nullable
- notes text nullable
- created_at timestamp default now()
- updated_at timestamp default now()

Tipologie:

- apartment
- villa
- office
- bnb
- holiday_home
- condominium
- shop
- professional_studio
- other

## reports

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- operator_id uuid references profiles(id)
- property_id uuid references properties(id)
- report_date date not null
- start_time time nullable
- end_time time nullable
- break_minutes integer default 0
- total_minutes integer nullable
- status text default 'draft'
- notes text nullable
- external_video_link text nullable
- external_video_description text nullable
- created_at timestamp default now()
- updated_at timestamp default now()

Stati:

- draft
- completed
- sent
- received
- approved
- disputed

## report_tasks

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- report_id uuid references reports(id) on delete cascade
- category text not null
- task_name text not null
- checked boolean default false
- created_at timestamp default now()

## report_anomalies

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- report_id uuid references reports(id) on delete cascade
- anomaly_name text not null
- checked boolean default false
- note text nullable
- created_at timestamp default now()

## report_photos

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- report_id uuid references reports(id) on delete cascade
- property_id uuid references properties(id)
- operator_id uuid references profiles(id)
- photo_category text not null
- file_url text not null
- thumbnail_url text nullable
- file_name text not null
- mime_type text not null
- file_size integer not null
- notes text nullable
- created_at timestamp default now()

Categorie:

- before
- after
- anomaly
- damage
- not_accessible
- other

## report_sends

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- report_id uuid references reports(id) on delete cascade
- channel text not null
- recipient text nullable
- status text not null
- sent_at timestamp nullable
- error_message text nullable
- created_at timestamp default now()

Canali:

- whatsapp
- telegram
- email

Stati:

- pending
- sent
- failed

## report_templates

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- name text not null
- description text nullable
- property_type text nullable
- is_default boolean default false
- created_at timestamp default now()
- updated_at timestamp default now()

## template_tasks

Campi:

- id uuid primary key
- company_id uuid references companies(id)
- template_id uuid references report_templates(id) on delete cascade
- category text not null
- task_name text not null
- checked_by_default boolean default true
- created_at timestamp default now()

## Supabase Storage

Bucket:

- report-photos

Percorso consigliato:

/company_id/reports/report_id/photos/file_name

Regole:

- Le foto non devono essere pubbliche senza controllo
- Usare accesso autenticato o signed URL
- Operatore vede solo foto dei propri report
- Admin vede foto della propria company
