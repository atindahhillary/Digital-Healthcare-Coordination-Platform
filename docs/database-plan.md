# AfyaConnect: real database plan

Status: planned and tested locally. Nothing has been created on Supabase or anywhere else.
Date: 2026-10-27

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
backups, and each account can have only two active free projects. **You already have two active
(`inua-toto-foundation` and `amora`), and Supabase refused a third on 2026-10-27** with: "maximum limits for the number
of active free projects ... (2 project limit)". The limit is per person across all organisations, so a new organisation
does not get around it (an earlier version of this plan said it would; that was wrong). I will not pause, delete or touch
those projects. The ways forward are: upgrade one organisation to Pro (about $25 a month, which lifts the limit),
or you pause one of the two projects yourself, or the AfyaConnect schema shares an existing project (not advised:
it mixes this app's patient data with another app's).

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
| 0b (done) | App side of capture: every action is queued on the device and sent to `capture_event()`; deleting an account erases it. Switched off until the project exists (no keys in `src/lib/capture.ts`) | nothing |
| 1 | Create the project, apply the three migrations, rerun the checks there, run the security advisor, seed 6 synthetic doctors, put the URL and publishable key into `src/lib/capture.ts` | **a free project slot or Pro upgrade (see section 3)** |
| 2 | Replace the browser-only store with a data layer that calls the functions. Keep demo mode behind a switch so the current live demo keeps working | nothing |
| 3 | Real sign-in with phone code; scheduler (pg_cron) plus a function that sends due reminders; live updates for the notification bell | an Africa's Talking account (test mode first) |
| 4 | Private storage bucket for ID and selfie images with owner-only access; admin review through short-lived links | nothing |
| 5 | Pilot hardening: backups, Kenyan hosting decision, privacy notice, retention period, penetration test, ODPC registration | counsel, budget |

## 6. Decisions I need from you

1. How to free a project slot: upgrade an organisation to Pro (about $25 a month), or pause one of your two active
   free projects yourself, or share a project (not advised). Creation was refused on 2026-10-27 for this reason.
2. Whether phase 1 stays on synthetic data only until the hosting question is settled. I recommend yes.
3. Who owns the Africa's Talking account for SMS (sender names are registered to the account holder).
4. Retention: how long do we keep a patient's record after they stop using the service?

## 7. Not done yet

- Nothing has been created on Supabase, and nothing has been bought. The create call was refused by the free-plan limit.
- The migrations, tests and the app's capture code are committed. The capture code does nothing until the project's
  URL and publishable key are added.
- The storage policies, scheduler and SMS hook are described above but not written, because they cannot be
  tested without a real project.
