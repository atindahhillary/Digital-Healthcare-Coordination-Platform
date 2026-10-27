# AfyaConnect: real database plan

Status (2026-10-27): phase 1 is live. The project `afyaconnect` (id `mmlekyvogfktjjsemfep`, Frankfurt `eu-central-1`,
Supabase Free plan, $0) has the schema, the access rules and the capture table applied, 10 fictional doctors, and the
app sends everything it does to it. The 28 access-rule checks pass on the real database, and the security advisor shows
only the expected warnings (see section 3b).

## 1. What this is

Today the live site keeps everything in the visitor's browser. That is right for a demo and wrong for real
patients: a doctor on one phone cannot see a booking made on another. The real database fixes that, and it
also lets us enforce the rules the chats asked for in one place that no screen can bypass.

The rules, in plain words:

1. A doctor sees a patient's file only after the patient has a confirmed booking with that doctor.
2. The patient can withdraw that access at any time, and the doctor is locked out at once.
3. Access lapses 90 days after a completed visit.
4. Every time a doctor opens a file, the patient can see it in their own log.
5. ID and KYC details are never shown to doctors. The full ID number is not stored at all.
6. Nobody, including admins, can edit or delete the access log.
7. Two people cannot take the same appointment slot.
8. Reminders (24 h, 2 h, 15 min before; then prescription nudges) are stored as rows and sent by a scheduler.

## 2. How the rules are enforced

| Layer | What it does |
|---|---|
| Row level security on all 12 tables | Nothing is readable unless a policy says so. Policies only allow SELECT. |
| No direct writes | Signed-in users have no INSERT, UPDATE or DELETE on any table. Every change goes through a function that checks who is calling. |
| `open_patient_file()` | The only way a doctor reads a patient file. It checks the booking and consent, writes the access log, then returns the file, all in one call. |
| `private` schema | Helper functions (`has_file_access`, `log`, `notify`) cannot be called by users at all. |
| Pinned `search_path` | Every security-definer function sets `search_path = ''`, which closes a classic privilege escalation. |
| Unique partial index | The database itself refuses a double booking. |
| Append-only trigger | The audit log raises an error on any update or delete, even for the table owner. |
| Phone from sign-in | The phone number is read from the verified login, never from the form. |

Files:

- `supabase/migrations/20261028000100_core_schema.sql` (tables, types, indexes)
- `supabase/migrations/20261028000200_access_rules.sql` (policies, functions, privileges)
- `supabase/tests/rls.test.mjs` (98 checks, run with `cd supabase/tests && npm i && node rls.test.mjs`)

The tests run against a real Postgres engine (PGlite) with Supabase's roles and `auth.uid()` recreated, and
they try to break each rule as the wrong person: another patient, another doctor, an admin, an anonymous
visitor, and the table owner. Result: 98 passed, 0 failed.

What the tests do not prove: that it behaves identically on Supabase itself. Once a project exists, I rerun
the same checks there and run Supabase's security advisor before anyone signs in.

## 3. What it will cost

Verified: the Supabase quote for a new project in your current organisation is **$0 per month** (it is on the
Free plan). Everything else is labelled as published or estimated, and should be rechecked before you pay.

| Item | When | Cost | Basis |
|---|---|---|---|
| Vercel hosting (as now) | now | $0 | existing |
| Supabase project on the Free plan, synthetic data only | build phase | $0 | quoted by Supabase for your org |
| Supabase Pro (1 project, daily backups) | pilot with real patients | about $25 to $30 per month | Supabase published pricing, last researched this session |
| Supabase Pro plus point-in-time recovery | pilot, if you want to undo mistakes by the minute | about $125 to $130 per month | published pricing |
| Self-hosting Supabase in a Kenyan data centre | pilot, if counsel says so | not quoted yet | needs 2 or 3 real quotes, plus someone to run it |
| SMS reminders (Africa's Talking) | pilot | roughly KES 0.5 to 1 per SMS; a booking sends about 8 to 10, so about KES 4 to 10 per booking | estimate |
| SMS sender name registration | pilot | one-off, roughly KES 5,000 to 15,000 | estimate |
| Video provider | pilot | free tiers exist; price depends on minutes | choose later |
| M-Pesa payments (Daraja API) | when payments go live | API is free; per-transaction fees apply | to confirm with Safaricom |
| Data Protection: ODPC registration, impact assessment, counsel | before real patients | fees set by the regulator and a lawyer's quote | not estimated |

Free plan limits that matter (published): projects pause after about a week without activity, there are no
backups, and each account can have only two active free projects. Supabase refused a third project on 2026-10-27
("2 project limit"; it is per person across all organisations, so a new organisation would not have helped). With the
owner's approval, `inua-toto-foundation` was paused (it can be restored from the dashboard or with `restore_project`)
to make room, and `afyaconnect` was created in its place. **Because the Free plan has no backups and pauses after a week
without activity, this is fine for the prototype but not for real patients: move to Pro (about $25 a month, which also
adds daily backups and removes the project limit) before launch.**

### 3b. Security advisor on the real project

- `app_events` has RLS on and no policies: intended, nobody reads it through the API.
- Two functions callable by visitors (`capture_event`, `erase_capture`) and 15 callable by signed-in users: intended,
  the whole write model is `SECURITY DEFINER` functions that check who is calling inside. Each one is covered by a test.
- One real finding, fixed: the audit-log trigger function had no pinned `search_path`
  (`supabase/migrations/20261028000400_trigger_search_path.sql`).

## 4. The Kenyan data rule (the real decision)

Under the Data Protection (General) Regulations 2021, regulation 26, health data must be processed on a
server or data centre in Kenya, or at least have one serving copy in Kenya. Supabase has no Africa region.
So:

- Building and testing with **synthetic data** on Supabase cloud is fine.
- Real patients need one of: (a) Supabase cloud with a Kenyan serving copy, (b) the same stack self-hosted in
  Kenya, or (c) another arrangement agreed with counsel.
- ODPC registration and a data protection impact assessment are needed before launch regardless.

This is a legal reading, not legal advice. Please confirm with a Kenyan data protection lawyer before real
patient data goes anywhere.

## 5. Phases

| Phase | Work | Needs from you |
|---|---|---|
| 0 (done) | Schema, rules, capture table, 98 passing checks | nothing |
| 0b (done) | App side of capture: every action is queued on the device and sent to `capture_event()`; deleting an account erases it | nothing |
| 1 (done) | Project created, migrations applied, rules checked on the real database, advisor run, 10 fictional doctors seeded, URL and publishable key in `src/lib/capture.ts` | nothing |
| 2 | Replace the browser-only store with a data layer that calls the functions. Keep demo mode behind a switch so the current live demo keeps working | nothing |
| 3 | Real sign-in with phone code; scheduler (pg_cron) plus a function that sends due reminders; live updates for the notification bell | an Africa's Talking account (test mode first) |
| 4 | Private storage bucket for ID and selfie images with owner-only access; admin review through short-lived links | nothing |
| 5 | Pilot hardening: backups, Kenyan hosting decision, privacy notice, retention period, penetration test, ODPC registration | counsel, budget |

## 6. Decisions I need from you

1. Whether to keep `inua-toto-foundation` paused or upgrade to Pro (about $25 a month) so both can run.
2. Whether the capture stays on synthetic and test data only until the hosting question is settled. I recommend yes:
   the app now saves what people enter (name, age, county, masked phone, conditions) in Germany, and the registration
   screen says so.
3. Who owns the Africa's Talking account for SMS (sender names are registered to the account holder).
4. Retention: how long do we keep a patient's record after they stop using the service?

## 7. Not done yet

- Nothing has been bought. The patient and specialist screens still run on the browser-only store; the database
  receives a copy of every action (phase 0b) but is not yet the source of truth. That is phase 2.
- Real sign-in (phone code) is not set up, so the strict patient, specialist and booking functions are tested and in
  place but not used by the app yet. Captured data is tied to a random browser id, not to a login.
- The Free plan has no backups. Do not rely on this database for anything you cannot lose.
- The storage policies, scheduler and SMS hook are described above but not written, because they cannot be
  tested without a real project.
