-- Capture of everything the app does (phase 1 prototype).
--
-- The strict patient/specialist model in the earlier migrations needs real sign-in (a verified phone) and real
-- two-sided use. Until that is switched on, the app still runs as one person acting as every role, and we do not
-- want to lose what that person does. So every action the app takes is written here, one row each.
--
--   * Nobody can read this table through the API. It is read in the Supabase dashboard or with the service role.
--   * The only way in is capture_event(), which checks the input and limits how fast one browser can write.
--   * client_id is a random id the browser keeps. It is not a login. Whoever holds it can erase its rows, and
--     erase_capture() is what the app calls when a patient deletes their account.

create table public.app_events (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  client_id   uuid not null,
  actor       text not null,              -- the role the person was acting as: patient, specialist, lab, ...
  patient_id  text,                       -- the app's patient id the action concerns
  demo        boolean not null default false, -- true when it concerns the built-in demo patient
  action      text not null,
  payload     jsonb not null default '{}',
  app_version text
);
create index app_events_client_idx on public.app_events (client_id, at desc);
create index app_events_action_idx on public.app_events (action, at desc);
alter table public.app_events enable row level security;
-- no policies on purpose: nothing is readable or writable through the API

revoke all on table public.app_events from anon, authenticated;
revoke all on sequence public.app_events_id_seq from anon, authenticated;

create function public.capture_event(
  p_client uuid, p_actor text, p_action text, p_payload jsonb default '{}', p_patient text default null,
  p_demo boolean default false, p_version text default null
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_client is null then raise exception 'client id required' using errcode = '22023'; end if;
  if p_actor is null or p_actor !~ '^[a-z]{1,24}$' then raise exception 'bad actor' using errcode = '22023'; end if;
  if p_action is null or p_action !~ '^[A-Za-z][A-Za-z0-9_.:-]{0,39}$' then raise exception 'bad action' using errcode = '22023'; end if;
  if p_patient is not null and length(p_patient) > 64 then raise exception 'bad patient id' using errcode = '22023'; end if;
  if pg_column_size(coalesce(p_payload, '{}'::jsonb)) > 32768 then raise exception 'payload too large' using errcode = '22023'; end if;
  -- gentle brake: one browser cannot write more than 200 actions a minute
  if (select count(*) from public.app_events e where e.client_id = p_client and e.at > now() - interval '1 minute') >= 200 then
    raise exception 'slow down' using errcode = '54000';
  end if;
  insert into public.app_events (client_id, actor, patient_id, demo, action, payload, app_version)
  values (p_client, p_actor, p_patient, coalesce(p_demo, false), p_action, coalesce(p_payload, '{}'::jsonb), left(p_version, 32));
end $$;

-- Erasure: a patient deleting their account deletes what was captured for their browser too.
create function public.erase_capture(p_client uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if p_client is null then raise exception 'client id required' using errcode = '22023'; end if;
  delete from public.app_events e where e.client_id = p_client;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.capture_event(uuid, text, text, jsonb, text, boolean, text) from public, anon, authenticated;
revoke all on function public.erase_capture(uuid) from public, anon, authenticated;
grant execute on function public.capture_event(uuid, text, text, jsonb, text, boolean, text) to anon, authenticated;
grant execute on function public.erase_capture(uuid) to anon, authenticated;
