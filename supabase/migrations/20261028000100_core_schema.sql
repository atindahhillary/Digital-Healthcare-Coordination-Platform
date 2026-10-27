-- AfyaConnect core schema (phase 1: patient and specialist).
-- Draft for review. Not applied to any database yet.
--
-- Principles
--   1. Every table has row level security ON. Nothing is readable by default.
--   2. Clients can only READ tables the policies allow. All WRITES go through the
--      security-definer functions in the next migration, which check who is calling.
--   3. A specialist reads a patient's file only through open_patient_file(), which checks
--      "booking confirmed AND consent not withdrawn" and writes the access log in the same call.

create schema if not exists private;

-- ---------- types ----------
create type public.user_role   as enum ('patient', 'specialist', 'admin', 'coordinator');
create type public.appt_status as enum ('requested', 'declined', 'confirmed', 'ready', 'delayed', 'recovery', 'in_consult', 'completed', 'cancelled', 'rescheduled', 'reassigned');
create type public.appt_mode   as enum ('virtual', 'physical');
create type public.kyc_status  as enum ('pending', 'verified', 'rejected');
create type public.rx_status   as enum ('issued', 'shared', 'collected');

-- ---------- people ----------
-- One row per signed-in person. The role is set by the trusted sign-up flow, never by the client.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null,
  full_name  text not null check (length(trim(full_name)) >= 3),
  created_at timestamptz not null default now()
);

create table public.patients (
  id                            uuid primary key references public.profiles (id) on delete cascade,
  dob                           date not null check (dob <= current_date),
  sex                           text not null check (sex in ('Female', 'Male', 'Prefer not to say')),
  county                        text not null,
  town                          text not null,
  nationality                   text not null default 'Kenyan',
  language                      text not null default 'English and Kiswahili',
  share_with_booked_specialists boolean not null default true,
  consent_version               text not null,
  consent_at                    timestamptz not null,
  created_at                    timestamptz not null default now(),
  deleted_at                    timestamptz
);

-- KYC. Never exposed to specialists. The full ID number is checked by the ID provider
-- and is not stored: only its last four characters and a salted hash (to catch duplicates).
create table public.patient_identity (
  patient_id         uuid primary key references public.patients (id) on delete cascade,
  phone_e164         text not null,
  email              text,
  id_type            text not null check (id_type in ('National ID', 'Passport', 'Alien ID', 'Birth certificate')),
  id_last4           text not null check (id_last4 ~ '^[A-Za-z0-9]{4}$'),
  id_number_hash     text not null,
  id_doc_path        text,
  selfie_path        text,
  guardian           jsonb,
  kyc_status         public.kyc_status not null default 'pending',
  kyc_submitted_at   timestamptz not null default now(),
  kyc_reviewed_at    timestamptz,
  kyc_reviewed_by    uuid references public.profiles (id)
);
create unique index patient_identity_id_hash_key on public.patient_identity (id_number_hash);

-- What a doctor needs to know. Readable by the patient, and by a specialist only via open_patient_file().
create table public.patient_health (
  patient_id        uuid primary key references public.patients (id) on delete cascade,
  conditions        text[] not null default '{}',
  allergies         text[] not null default '{}',
  medications       text[] not null default '{}',
  blood_group       text,
  emergency_contact jsonb,
  insurance         jsonb,
  updated_at        timestamptz not null default now()
);

create table public.specialists (
  id            uuid primary key references public.profiles (id) on delete cascade,
  display_name  text not null,
  title         text not null,
  specialty     text not null,
  clinic        text not null,
  county        text not null,
  town          text not null,
  fee_in_person integer not null check (fee_in_person >= 0),
  fee_virtual   integer not null check (fee_virtual >= 0),
  reg_regulator text not null default 'KMPDC',
  reg_no        text not null,
  verified      boolean not null default false,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------- bookings ----------
create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients (id),
  specialist_id uuid not null references public.specialists (id),
  starts_at     timestamptz not null,
  mode          public.appt_mode not null,
  fee           integer not null check (fee >= 0),
  reason        text not null default 'Consultation',
  status        public.appt_status not null default 'requested',
  join_code     text unique,
  payment_state text not null default 'held' check (payment_state in ('held', 'captured', 'released', 'refunded')),
  payment_ref   text,
  requested_at  timestamptz not null default now(),
  confirmed_at  timestamptz,
  delay_min     integer
);
-- No double booking, enforced by the database.
create unique index appointments_no_double_booking
  on public.appointments (specialist_id, starts_at)
  where status in ('requested', 'confirmed', 'ready', 'delayed', 'recovery', 'in_consult');
create index appointments_patient_idx    on public.appointments (patient_id, starts_at desc);
create index appointments_specialist_idx on public.appointments (specialist_id, starts_at);

create table public.appointment_events (
  id             bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  at             timestamptz not null default now(),
  actor_id       uuid,
  actor_label    text not null,
  label          text not null,
  tone           text
);
create index appointment_events_appt_idx on public.appointment_events (appointment_id, at);

-- Who the patient lets see their file. A row appears when a booking is confirmed.
create table public.consents (
  patient_id uuid not null references public.patients (id) on delete cascade,
  grantee_id uuid not null references public.profiles (id) on delete cascade,
  granted    boolean not null default true,
  scope      text not null default 'History, visit summaries and prescriptions, for the care they give you',
  updated_at timestamptz not null default now(),
  primary key (patient_id, grantee_id)
);

-- ---------- care ----------
create table public.consultations (
  appointment_id  uuid primary key references public.appointments (id) on delete cascade,
  patient_id      uuid not null references public.patients (id),
  specialist_id   uuid not null references public.specialists (id),
  summary         text not null,            -- written for the patient, part of their record
  clinical_notes  text,                     -- the author's private working notes
  follow_up_weeks integer check (follow_up_weeks between 1 and 104),
  tests_advised   text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create table public.prescriptions (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  patient_id     uuid not null references public.patients (id),
  specialist_id  uuid not null references public.specialists (id),
  appointment_id uuid references public.appointments (id),
  items          jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  status         public.rx_status not null default 'issued',
  pharmacy_choice text,
  refills_left   integer not null default 2,
  created_at     timestamptz not null default now(),
  shared_at      timestamptz,
  collected_at   timestamptz
);
create index prescriptions_patient_idx on public.prescriptions (patient_id, created_at desc);

-- ---------- messages and trail ----------
-- Both the in-app inbox and the reminder queue. due_at in the future = a scheduled reminder.
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null,
  channels   text[] not null default '{app}' check (channels <@ array['app', 'sms']),
  due_at     timestamptz not null default now(),
  sent_at    timestamptz,
  read_at    timestamptz,
  related_id uuid,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, due_at desc);
create index notifications_due_idx  on public.notifications (due_at) where sent_at is null;

-- Append-only. Shown to patients as "who opened my file".
create table public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  -- No foreign key on purpose: the trail must survive an account deletion, and an FK action would
  -- try to update this append-only table. After erasure the id no longer points at a person.
  patient_id uuid,
  actor_id   uuid,
  actor_role text not null,
  action     text not null,
  resource   text
);
create index audit_log_patient_idx on public.audit_log (patient_id, at desc);

create function private.audit_log_is_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end $$;
create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function private.audit_log_is_append_only();
