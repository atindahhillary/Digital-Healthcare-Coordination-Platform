-- AfyaConnect access rules, enforced in the database.
-- Draft for review. Not applied to any database yet.
--
-- Shape of the security model:
--   * RLS is ON for every table. Policies below only ever allow SELECT.
--   * Clients get no INSERT/UPDATE/DELETE on any table. Every change goes through a function
--     that checks who is calling and what state the record is in.
--   * All functions are SECURITY DEFINER with an empty search_path, and only the
--     functions named in the GRANT section are callable by signed-in users.

-- ============================================================ helpers (private)
create function private.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select private.my_role()) = 'admin', false)
$$;

-- THE RULE. A specialist can open a patient's file only if
--   (a) they have a confirmed booking with that patient (or finished a visit in the last 90 days), and
--   (b) the patient has not withdrawn access.
create function private.has_file_access(p_patient uuid, p_specialist uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
           select 1 from public.appointments a
           where a.patient_id = p_patient
             and a.specialist_id = p_specialist
             and (a.status in ('confirmed', 'ready', 'delayed', 'recovery', 'in_consult')
                  or (a.status = 'completed' and a.starts_at > now() - interval '90 days'))
         )
     and not exists (
           select 1 from public.consents c
           where c.patient_id = p_patient and c.grantee_id = p_specialist and c.granted = false
         )
$$;

create function private.log(p_patient uuid, p_action text, p_resource text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (patient_id, actor_id, actor_role, action, resource)
  values (p_patient, (select auth.uid()), coalesce((select private.my_role())::text, 'system'), p_action, p_resource)
$$;

create function private.event(p_appt uuid, p_label text, p_tone text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.appointment_events (appointment_id, actor_id, actor_label, label, tone)
  values (p_appt, (select auth.uid()), coalesce((select private.my_role())::text, 'platform'), p_label, p_tone)
$$;

create function private.notify(p_user uuid, p_kind text, p_title text, p_body text, p_channels text[],
                               p_due timestamptz default now(), p_related uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, channels, due_at, related_id)
  values (p_user, p_kind, p_title, p_body, p_channels, p_due, p_related)
$$;

-- ============================================================ row level security (read rules)
alter table public.profiles           enable row level security;
alter table public.patients           enable row level security;
alter table public.patient_identity   enable row level security;
alter table public.patient_health     enable row level security;
alter table public.specialists        enable row level security;
alter table public.appointments       enable row level security;
alter table public.appointment_events enable row level security;
alter table public.consents           enable row level security;
alter table public.consultations      enable row level security;
alter table public.prescriptions      enable row level security;
alter table public.notifications      enable row level security;
alter table public.audit_log          enable row level security;

create policy profiles_own        on public.profiles         for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy patients_own        on public.patients         for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
-- KYC: the patient and the admin who reviews it. Never a specialist.
create policy identity_own        on public.patient_identity for select to authenticated using (patient_id = (select auth.uid()) or (select private.is_admin()));
-- Health basics: the patient only. A specialist gets them through open_patient_file().
create policy health_own          on public.patient_health   for select to authenticated using (patient_id = (select auth.uid()));
-- The directory is public: anyone can see verified specialists. A specialist (or an admin) also sees their own row.
-- Kept as two policies so that anonymous visitors never evaluate the private helper functions.
create policy specialists_public  on public.specialists      for select to anon, authenticated using (verified);
create policy specialists_self    on public.specialists      for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy appts_parties       on public.appointments     for select to authenticated using (patient_id = (select auth.uid()) or specialist_id = (select auth.uid()) or (select private.is_admin()));
create policy events_parties      on public.appointment_events for select to authenticated using (
  exists (select 1 from public.appointments a where a.id = appointment_id and (a.patient_id = (select auth.uid()) or a.specialist_id = (select auth.uid())))
);
create policy consents_own        on public.consents         for select to authenticated using (patient_id = (select auth.uid()));
-- Visit summaries: the patient, and the doctor who wrote them. Other doctors use open_patient_file().
create policy consult_parties     on public.consultations    for select to authenticated using (patient_id = (select auth.uid()) or specialist_id = (select auth.uid()));
create policy rx_parties          on public.prescriptions    for select to authenticated using (patient_id = (select auth.uid()) or specialist_id = (select auth.uid()));
create policy notes_own           on public.notifications    for select to authenticated using (user_id = (select auth.uid()) and due_at <= now());
-- "Who opened my file": the patient sees their own trail. Admins see all.
create policy audit_patient       on public.audit_log        for select to authenticated using (patient_id = (select auth.uid()) or (select private.is_admin()));

-- ============================================================ writes: one function per action

-- ---- patient registration (called after the phone OTP has signed the person in)
create function public.register_patient(
  p_dob date, p_sex text, p_county text, p_town text, p_nationality text, p_language text,
  p_id_type text, p_id_last4 text, p_id_hash text, p_id_doc_path text, p_selfie_path text, p_guardian jsonb,
  p_email text, p_conditions text[], p_allergies text[], p_medications text[], p_blood_group text,
  p_emergency jsonb, p_insurance jsonb, p_share boolean, p_consent_version text
) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); phone text;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if (select private.my_role()) is distinct from 'patient' then raise exception 'only patients can register' using errcode = '42501'; end if;
  if exists (select 1 from public.patients where id = uid) then raise exception 'already registered'; end if;
  if p_dob > current_date - interval '18 years' and p_guardian is null then raise exception 'a guardian is required under 18'; end if;
  -- The phone number comes from the verified sign-in, never from the client.
  select u.phone into phone from auth.users u where u.id = uid;
  if phone is null then raise exception 'phone not verified'; end if;

  insert into public.patients (id, dob, sex, county, town, nationality, language, share_with_booked_specialists, consent_version, consent_at)
  values (uid, p_dob, p_sex, p_county, p_town, p_nationality, p_language, p_share, p_consent_version, now());
  insert into public.patient_identity (patient_id, phone_e164, email, id_type, id_last4, id_number_hash, id_doc_path, selfie_path, guardian)
  values (uid, phone, p_email, p_id_type, p_id_last4, p_id_hash, p_id_doc_path, p_selfie_path, p_guardian);
  insert into public.patient_health (patient_id, conditions, allergies, medications, blood_group, emergency_contact, insurance)
  values (uid, coalesce(p_conditions, '{}'), coalesce(p_allergies, '{}'), coalesce(p_medications, '{}'), p_blood_group, p_emergency, p_insurance);

  perform private.log(uid, 'Registered. Consent recorded (privacy notice ' || p_consent_version || ')', 'patient');
  perform private.notify(uid, 'welcome', 'Welcome', 'Your account is ready. We will confirm your ID within 24 hours.', array['app', 'sms']);
end $$;

-- ---- admin reviews a patient's ID
create function public.review_kyc(p_patient uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (select private.is_admin()) then raise exception 'admins only' using errcode = '42501'; end if;
  update public.patient_identity
     set kyc_status = case when p_approve then 'verified'::public.kyc_status else 'rejected'::public.kyc_status end,
         kyc_reviewed_at = now(), kyc_reviewed_by = (select auth.uid())
   where patient_id = p_patient;
  if not found then raise exception 'no such patient'; end if;
  perform private.log(p_patient, case when p_approve then 'ID verified' else 'ID check: new photo requested' end, 'patient_identity');
  perform private.notify(p_patient, 'kyc', case when p_approve then 'Your ID is verified' else 'We need a clearer ID photo' end,
    case when p_approve then 'Doctors will now see a verified badge next to your name.' else 'Please upload the front of your ID again from your profile.' end, array['app', 'sms']);
end $$;

-- ---- booking
create function public.request_appointment(p_specialist uuid, p_starts_at timestamptz, p_mode public.appt_mode, p_reason text default 'Consultation')
returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); s public.specialists; new_id uuid;
begin
  if not exists (select 1 from public.patients where id = uid and deleted_at is null) then raise exception 'only registered patients can book' using errcode = '42501'; end if;
  select * into s from public.specialists where specialists.id = p_specialist and verified;
  if not found then raise exception 'specialist not available'; end if;
  if p_starts_at is null or p_starts_at < now() + interval '30 minutes' then raise exception 'choose a later time'; end if;
  insert into public.appointments (patient_id, specialist_id, starts_at, mode, fee, reason)
  values (uid, p_specialist, p_starts_at, p_mode, case when p_mode = 'virtual' then s.fee_virtual else s.fee_in_person end, coalesce(nullif(trim(p_reason), ''), 'Consultation'))
  returning appointments.id into new_id;
  perform private.event(new_id, 'Booking request sent. Payment is held until the doctor confirms', 'ok');
  perform private.notify(uid, 'booking_requested', 'Booking request sent', 'We will tell you the moment ' || s.display_name || ' confirms.', array['app', 'sms'], now(), new_id);
  perform private.notify(p_specialist, 'booking_request', 'New booking request', 'A patient asked for ' || to_char(p_starts_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI') || '. Confirm to open their file.', array['app', 'sms'], now(), new_id);
  return new_id;
end $$;

-- Confirming shares the video link, schedules reminders for both people, and opens the file.
create function public.confirm_appointment(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); a public.appointments; code text; share boolean; h record;
begin
  select * into a from public.appointments where id = p_id for update;
  if not found or a.specialist_id <> uid then raise exception 'not your booking' using errcode = '42501'; end if;
  if a.status <> 'requested' then raise exception 'booking is not waiting for confirmation'; end if;
  if a.mode = 'virtual' then
    code := substr(md5(gen_random_uuid()::text), 1, 3) || '-' || substr(md5(gen_random_uuid()::text), 1, 4) || '-' || substr(md5(gen_random_uuid()::text), 1, 3);
  end if;
  update public.appointments set status = 'confirmed', confirmed_at = now(), join_code = code where id = p_id;

  -- The patient's choice about sharing applies from the first booking; they can change it any time.
  select share_with_booked_specialists into share from public.patients where id = a.patient_id;
  insert into public.consents (patient_id, grantee_id, granted) values (a.patient_id, uid, coalesce(share, true))
  on conflict (patient_id, grantee_id) do nothing;

  -- Reminders to both people, SMS and app, that are still ahead of us.
  for h in select * from (values ('24 hours before', interval '24 hours'), ('2 hours before', interval '2 hours'),
                                 (case when a.mode = 'virtual' then '15 minutes before, with the video link' else '15 minutes before, with directions' end, interval '15 minutes')) as r(label, lead)
  loop
    if a.starts_at - h.lead > now() then
      perform private.notify(a.patient_id,    'reminder', 'Your visit is ' || h.label, 'Reminder for ' || to_char(a.starts_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI') || coalesce('. Video link: /room/' || code, ''), array['app', 'sms'], a.starts_at - h.lead, p_id);
      perform private.notify(a.specialist_id, 'reminder', 'Visit ' || h.label,    'Reminder for ' || to_char(a.starts_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI') || coalesce('. Video link: /room/' || code, ''), array['app', 'sms'], a.starts_at - h.lead, p_id);
    end if;
  end loop;

  perform private.event(p_id, 'Confirmed. Video link and reminders sent to both people. Patient file opened to the doctor for this booking', 'ok');
  perform private.notify(a.patient_id, 'booking_confirmed', 'Your booking is confirmed', coalesce('Your video link: /room/' || code || '. ', '') || 'We remind you before the visit.', array['app', 'sms'], now(), p_id);
  perform private.log(a.patient_id, 'Booking confirmed. File access opened to the specialist for this visit', 'appointment ' || p_id);
  return code;
end $$;

create function public.decline_appointment(p_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); a public.appointments;
begin
  select * into a from public.appointments where id = p_id for update;
  if not found or a.specialist_id <> uid then raise exception 'not your booking' using errcode = '42501'; end if;
  if a.status <> 'requested' then raise exception 'booking is not waiting for confirmation'; end if;
  update public.appointments set status = 'declined', payment_state = 'released' where id = p_id;
  perform private.event(p_id, 'Declined' || coalesce(': ' || p_reason, '') || '. Payment released in full', 'warn');
  perform private.notify(a.patient_id, 'booking_declined', 'That slot is not available', 'You have not been charged. Pick another time or another specialist.', array['app', 'sms'], now(), p_id);
end $$;

create function public.cancel_appointment(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); a public.appointments;
begin
  select * into a from public.appointments where id = p_id for update;
  if not found or uid not in (a.patient_id, a.specialist_id) then raise exception 'not your booking' using errcode = '42501'; end if;
  if a.status not in ('requested', 'confirmed') then raise exception 'this booking can no longer be cancelled'; end if;
  update public.appointments set status = 'cancelled', payment_state = 'released' where id = p_id;
  -- Pending reminders for a cancelled visit must not go out.
  delete from public.notifications where related_id = p_id and kind = 'reminder' and sent_at is null and due_at > now();
  perform private.event(p_id, 'Cancelled. Payment released', 'info');
end $$;

-- ---- the patient's control over their file
create function public.set_file_access(p_specialist uuid, p_granted boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.patients where id = uid) then raise exception 'patients only' using errcode = '42501'; end if;
  insert into public.consents (patient_id, grantee_id, granted) values (uid, p_specialist, p_granted)
  on conflict (patient_id, grantee_id) do update set granted = excluded.granted, updated_at = now();
  perform private.log(uid, case when p_granted then 'Access allowed' else 'Access withdrawn' end, 'specialist ' || p_specialist);
end $$;

-- ---- what a specialist sees BEFORE confirming: name, age, reason. No health data.
create function public.specialist_schedule()
returns table (appointment_id uuid, patient_id uuid, patient_name text, patient_age int, sex text, id_verified boolean,
               starts_at timestamptz, mode public.appt_mode, reason text, status public.appt_status, fee int, join_code text)
language sql stable security definer set search_path = '' as $$
  select a.id, a.patient_id, p.full_name, date_part('year', age(pt.dob))::int, pt.sex, i.kyc_status = 'verified',
         a.starts_at, a.mode, a.reason, a.status, a.fee, a.join_code
  from public.appointments a
  join public.patients pt on pt.id = a.patient_id
  join public.profiles p on p.id = a.patient_id
  join public.patient_identity i on i.patient_id = a.patient_id
  where a.specialist_id = (select auth.uid())
  order by a.starts_at
$$;

-- ---- the only door to a patient's file for a specialist. Checks the rule and writes the log.
create function public.open_patient_file(p_patient uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); out jsonb;
begin
  if uid <> p_patient and not coalesce((select private.has_file_access(p_patient, uid)), false) then
    raise exception 'no access to this file: a confirmed booking and the patient''s consent are required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.patients where id = p_patient and deleted_at is null) then
    raise exception 'record not available' using errcode = 'P0002';
  end if;
  if uid <> p_patient then perform private.log(p_patient, 'Opened patient file (access from a confirmed booking)', 'patient_file'); end if;
  select jsonb_build_object(
    'name', p.full_name,
    'age', date_part('year', age(pt.dob))::int,
    'sex', pt.sex,
    'county', pt.county || ' (' || pt.town || ')',
    'id_verified', i.kyc_status = 'verified',
    'conditions', h.conditions, 'allergies', h.allergies, 'medications', h.medications,
    'blood_group', h.blood_group, 'emergency_contact', h.emergency_contact,
    'visits', coalesce((select jsonb_agg(jsonb_build_object('date', a.starts_at, 'doctor', s.display_name, 'reason', a.reason, 'summary', c.summary,
                          'follow_up_weeks', c.follow_up_weeks, 'tests_advised', c.tests_advised) order by a.starts_at desc)
                        from public.consultations c join public.appointments a on a.id = c.appointment_id join public.specialists s on s.id = c.specialist_id
                        where c.patient_id = p_patient), '[]'::jsonb),
    'prescriptions', coalesce((select jsonb_agg(jsonb_build_object('code', r.code, 'issued', r.created_at, 'status', r.status, 'items', r.items) order by r.created_at desc)
                        from public.prescriptions r where r.patient_id = p_patient), '[]'::jsonb)
  ) into out
  from public.patients pt
  join public.profiles p on p.id = pt.id
  join public.patient_identity i on i.patient_id = pt.id
  join public.patient_health h on h.patient_id = pt.id
  where pt.id = p_patient and pt.deleted_at is null;
  return out;
end $$;

-- ---- finishing a visit: summary to the record, optional prescription, reminders until a pharmacy is chosen
create function public.complete_consultation(p_id uuid, p_summary text, p_notes text, p_follow_up_weeks int, p_tests text[], p_items jsonb default '[]')
returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); a public.appointments; rx_code text;
begin
  select * into a from public.appointments where id = p_id for update;
  if not found or a.specialist_id <> uid then raise exception 'not your booking' using errcode = '42501'; end if;
  if a.status not in ('confirmed', 'ready', 'delayed', 'in_consult') then raise exception 'this visit cannot be completed from its current state'; end if;
  update public.appointments set status = 'completed' where id = p_id;
  insert into public.consultations (appointment_id, patient_id, specialist_id, summary, clinical_notes, follow_up_weeks, tests_advised)
  values (p_id, a.patient_id, uid, p_summary, p_notes, p_follow_up_weeks, coalesce(p_tests, '{}'));
  perform private.event(p_id, 'Visit completed. Summary and follow-up saved to the patient''s record', 'ok');
  perform private.notify(a.patient_id, 'visit_summary', 'Visit summary added to your record', 'Your doctor saved your summary and follow-up plan.', array['app'], now(), p_id);
  if jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0 then
    rx_code := 'RX-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    insert into public.prescriptions (code, patient_id, specialist_id, appointment_id, items) values (rx_code, a.patient_id, uid, p_id, p_items);
    perform private.notify(a.patient_id, 'rx_issued', 'Prescription ready: choose your pharmacy', 'Prescription ' || rx_code || ' is ready. Pick the pharmacy you prefer. We will keep reminding you until it is done.', array['app', 'sms'], now());
  end if;
  return rx_code;
end $$;

-- ---- the patient holds the prescription and picks the pharmacy
create function public.choose_pharmacy(p_rx uuid, p_pharmacy text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.prescriptions set status = 'shared', pharmacy_choice = p_pharmacy, shared_at = now()
   where id = p_rx and patient_id = (select auth.uid()) and status = 'issued';
  if not found then raise exception 'prescription not found or already shared'; end if;
  perform private.log((select auth.uid()), 'Chose a pharmacy for a prescription (patient''s choice)', 'prescription ' || p_rx);
end $$;

create function public.collect_prescription(p_rx uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.prescriptions set status = 'collected', collected_at = now()
   where id = p_rx and patient_id = (select auth.uid()) and status = 'shared';
  if not found then raise exception 'prescription not found or not shared yet'; end if;
end $$;

-- Reminders until a pharmacy is chosen: 1 h, 24 h, 72 h, then weekly. Called every few minutes by the scheduler.
-- Idempotent: it only adds the reminders that are due and not yet queued.
create function public.rx_reminder_tick() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; due int; have int; n int := 0; hrs numeric;
begin
  for r in select id, code, patient_id, created_at from public.prescriptions where status = 'issued' loop
    hrs := extract(epoch from (now() - r.created_at)) / 3600;
    due := (case when hrs >= 1 then 1 else 0 end) + (case when hrs >= 24 then 1 else 0 end) + (case when hrs >= 72 then 1 else 0 end)
           + greatest(0, floor((hrs - 72) / 168))::int;
    select count(*) into have from public.notifications where related_id = r.id and kind = 'rx_reminder';
    while have < due loop
      insert into public.notifications (user_id, kind, title, body, channels, related_id)
      values (r.patient_id, 'rx_reminder', 'Your prescription is waiting', 'Prescription ' || r.code || ' is waiting for you to choose a pharmacy.', array['app', 'sms'], r.id);
      have := have + 1; n := n + 1;
    end loop;
  end loop;
  return n;
end $$;

-- ---- patient rights: read your own data, erase it
create function public.download_my_record() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.patients where id = uid) then raise exception 'patients only' using errcode = '42501'; end if;
  return public.open_patient_file(uid) || jsonb_build_object(
    'identity', (select to_jsonb(i) - 'id_number_hash' from public.patient_identity i where i.patient_id = uid),
    'consents', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.consents c where c.patient_id = uid),
    'access_log', (select coalesce(jsonb_agg(to_jsonb(l) order by l.at desc), '[]'::jsonb) from public.audit_log l where l.patient_id = uid));
end $$;

-- Erases personal details. Appointments and prescriptions stay only as long as the law requires
-- (retention period to be confirmed with counsel) and no longer point at a named person.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.patients where id = uid and deleted_at is null) then raise exception 'patients only' using errcode = '42501'; end if;
  perform private.log(uid, 'Account deleted at the patient''s request', 'patient');
  delete from public.patient_health   where patient_id = uid;
  delete from public.patient_identity where patient_id = uid;
  delete from public.consents         where patient_id = uid;
  delete from public.notifications    where user_id = uid;
  update public.consultations set clinical_notes = null, summary = '[erased at the patient''s request]' where patient_id = uid;
  update public.profiles set full_name = 'Deleted user' where id = uid;
  update public.patients set deleted_at = now(), county = 'erased', town = 'erased' where id = uid;
end $$;

create function public.mark_notifications_read() returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now() where user_id = (select auth.uid()) and read_at is null and due_at <= now()
$$;

-- ============================================================ privileges
-- Start from nothing, then grant only what each audience needs.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
revoke usage on schema private from public, anon;
grant usage on schema private to authenticated;               -- policies call private.is_admin()
grant execute on function private.is_admin() to authenticated;

grant select on public.specialists to anon;                   -- the public directory
grant select on public.profiles, public.patients, public.patient_identity, public.patient_health, public.specialists,
                public.appointments, public.appointment_events, public.consents, public.consultations,
                public.prescriptions, public.notifications, public.audit_log to authenticated;

grant execute on function
  public.register_patient(date, text, text, text, text, text, text, text, text, text, text, jsonb, text, text[], text[], text[], text, jsonb, jsonb, boolean, text),
  public.review_kyc(uuid, boolean),
  public.request_appointment(uuid, timestamptz, public.appt_mode, text),
  public.confirm_appointment(uuid),
  public.decline_appointment(uuid, text),
  public.cancel_appointment(uuid),
  public.set_file_access(uuid, boolean),
  public.specialist_schedule(),
  public.open_patient_file(uuid),
  public.complete_consultation(uuid, text, text, int, text[], jsonb),
  public.choose_pharmacy(uuid, text),
  public.collect_prescription(uuid),
  public.download_my_record(),
  public.delete_my_account(),
  public.mark_notifications_read()
to authenticated;
-- rx_reminder_tick() is for the scheduler only (service role), so it is deliberately not granted above.

-- Future tables in public must not be open by accident.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;
