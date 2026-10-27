// Tests the access rules against a real Postgres (PGlite, in-process). No Supabase project needed.
// It recreates the pieces of Supabase the migrations depend on (roles, auth.uid(), default privileges),
// applies the migrations, then tries to break the rules as different people.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const db = new PGlite();
let passed = 0;
let failed = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { passed++; console.log("  PASS", name); } else { failed++; console.log("  FAIL", name, extra); }
};

// ---------- the parts of Supabase the migrations rely on ----------
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, phone text, email text, raw_app_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  -- Supabase hands every role everything on new objects in public. Test against that worst case.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`);
const dir = join(here, "..", "migrations");
for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, f), "utf8"));

// ---------- helpers ----------
const U = {
  patA: "00000000-0000-0000-0000-00000000000a", patB: "00000000-0000-0000-0000-00000000000b",
  doc1: "00000000-0000-0000-0000-0000000000d1", doc2: "00000000-0000-0000-0000-0000000000d2", doc3: "00000000-0000-0000-0000-0000000000d3",
  adm: "00000000-0000-0000-0000-0000000000ad",
};
// Run SQL as a signed-in user (or anon). RLS and grants apply exactly as they would for the API.
async function as(who, sql, params = []) {
  await db.exec("reset role");
  if (who === "anon") { await db.exec("set role anon; select set_config('request.jwt.claim.sub', '', false)"); }
  else { await db.exec("set role authenticated"); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [U[who] ?? who]); }
  try { return (await db.query(sql, params)).rows; } finally { await db.exec("reset role"); }
}
async function fails(who, sql, params = []) {
  try { await as(who, sql, params); return null; } catch (e) { return String(e.message || e); }
}
const su = async (sql, params = []) => { await db.exec("reset role"); return (await db.query(sql, params)).rows; };
const slot = (hours) => new Date(Date.now() + hours * 3600e3).toISOString();

// ---------- fixtures (made by the trusted sign-up flow, i.e. superuser) ----------
for (const [k, name, role, phone] of [
  ["patA", "Wanjiru Njoroge", "patient", "+254712000001"], ["patB", "Brian Otieno", "patient", "+254712000002"],
  ["doc1", "Dr. Amina Odhiambo", "specialist", "+254700000011"], ["doc2", "Dr. Njeri Mwangi", "specialist", "+254700000012"],
  ["doc3", "Dr. Peter Sankale", "specialist", "+254700000013"], ["adm", "Ops Admin", "admin", "+254700000099"],
]) {
  await su("insert into auth.users (id, phone) values ($1, $2)", [U[k], phone]);
  await su("insert into public.profiles (id, role, full_name) values ($1, $2, $3)", [U[k], role, name]);
}
for (const [k, verified] of [["doc1", true], ["doc2", true], ["doc3", false]]) {
  await su(`insert into public.specialists (id, display_name, title, specialty, clinic, county, town, fee_in_person, fee_virtual, reg_no, verified)
            values ($1, (select full_name from public.profiles where id = $1), 'Consultant', 'Rheumatology', 'Test Clinic', 'Nairobi', 'Upper Hill', 4500, 3500, 'DEMO-' || $2, $3)`, [U[k], k, verified]);
}
const reg = (over = {}) => {
  const a = { dob: "1990-05-12", id_hash: "hash-A", last4: "5678", guardian: null, ...over };
  return [a.dob, "Female", "Nairobi", "Kasarani", "Kenyan", "English and Kiswahili", "National ID", a.last4, a.id_hash, "kyc/id.png", null, a.guardian ? JSON.stringify(a.guardian) : null,
    null, ["Lupus (SLE)"], ["penicillin"], ["Prednisolone 5 mg"], "O+", JSON.stringify({ name: "Mary", relation: "Sister", phone: "+254 7•• ••• 111" }), null, true, "2026-10"];
};
const REG = "select public.register_patient($1::date,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14::text[],$15::text[],$16::text[],$17,$18::jsonb,$19::jsonb,$20,$21)";

console.log("\nRegistration and KYC");
await as("patA", REG, reg());
ok("a patient can register (profile, identity and health rows created)", (await su("select count(*)::int c from public.patients p join public.patient_identity i on i.patient_id = p.id join public.patient_health h on h.patient_id = p.id where p.id = $1", [U.patA]))[0].c === 1);
ok("the phone number comes from the verified sign-in, not the form", (await su("select phone_e164 from public.patient_identity where patient_id = $1", [U.patA]))[0].phone_e164 === "+254712000001");
ok("registering twice is refused", /already registered/.test(await fails("patA", REG, reg({ id_hash: "hash-A2" })) ?? ""));
ok("a specialist cannot register as a patient", /only patients/.test(await fails("doc1", REG, reg({ id_hash: "hash-X" })) ?? ""));
ok("under 18 without a guardian is refused", /guardian/.test(await fails("patB", REG, reg({ dob: new Date(Date.now() - 10 * 365.25 * 864e5).toISOString().slice(0, 10), id_hash: "hash-B" })) ?? ""));
await as("patB", REG, reg({ id_hash: "hash-B", last4: "1111" }));
// A third person tries to register with an ID number already on file (same salted hash as patient A).
const patC = "00000000-0000-0000-0000-00000000000c";
await su("insert into auth.users (id, phone) values ($1, $2)", [patC, "+254712000003"]);
await su("insert into public.profiles (id, role, full_name) values ($1, $2, $3)", [patC, "patient", "Carol Wekesa"]);
U.patC = patC;
ok("the same ID number cannot be registered twice (duplicate hash)", /duplicate key|unique constraint/i.test(await fails("patC", REG, reg({ id_hash: "hash-A" })) ?? ""));
ok("the failed attempt left no half-registered patient behind", (await su("select count(*)::int c from public.patients where id = $1", [patC]))[0].c === 0);

console.log("\nWho can read what");
ok("a patient sees only their own patient row", (await as("patA", "select id from public.patients")).length === 1);
ok("a patient sees only their own health row", (await as("patA", "select patient_id from public.patient_health")).every((r) => r.patient_id === U.patA));
ok("a specialist reads no patient rows directly", (await as("doc1", "select * from public.patients")).length === 0);
ok("a specialist reads no health data directly", (await as("doc1", "select * from public.patient_health")).length === 0);
ok("a specialist reads no ID or KYC data", (await as("doc1", "select * from public.patient_identity")).length === 0);
ok("the public directory shows verified specialists only", (await as("anon", "select id from public.specialists")).length === 2);
ok("anonymous visitors cannot read patients", /permission denied/.test(await fails("anon", "select * from public.patients") ?? ""));
ok("anonymous visitors cannot read appointments", /permission denied/.test(await fails("anon", "select * from public.appointments") ?? ""));
ok("anonymous visitors cannot call booking functions", /permission denied/.test(await fails("anon", "select public.cancel_appointment(gen_random_uuid())") ?? ""));
ok("the unverified specialist is hidden from the public but visible to themselves", (await as("doc3", "select id from public.specialists where id = $1", [U.doc3])).length === 1);
ok("the admin can read KYC data", (await as("adm", "select * from public.patient_identity")).length === 2);
ok("the admin cannot read health data", (await as("adm", "select * from public.patient_health")).length === 0);

console.log("\nBooking, confirmation and file access");
const [{ request_appointment: apptId }] = await as("patA", "select public.request_appointment($1, $2::timestamptz, 'virtual', 'Lupus review') as request_appointment", [U.doc1, slot(3)]);
ok("a patient can request an appointment", !!apptId);
ok("the specialist sees the request", (await as("doc1", "select id from public.appointments")).length === 1);
ok("another specialist does not", (await as("doc2", "select id from public.appointments")).length === 0);
ok("another patient does not", (await as("patB", "select id from public.appointments")).length === 0);
const sched = await as("doc1", "select * from public.specialist_schedule()");
ok("before confirming, the doctor sees name, age and reason but no health data", sched.length === 1 && sched[0].patient_name === "Wanjiru Njoroge" && !("conditions" in sched[0]) && sched[0].reason === "Lupus review");
ok("the file is closed before confirmation", /no access/.test(await fails("doc1", "select public.open_patient_file($1)", [U.patA]) ?? ""));
ok("a patient cannot confirm their own booking", /not your booking/.test(await fails("patA", "select public.confirm_appointment($1)", [apptId]) ?? ""));
ok("a patient cannot change a status directly", /permission denied/.test(await fails("patA", "update public.appointments set status = 'confirmed' where id = $1", [apptId]) ?? ""));
ok("a patient cannot insert an appointment directly", /permission denied/.test(await fails("patA", "insert into public.appointments (patient_id, specialist_id, starts_at, mode, fee) values ($1, $2, now() + interval '9 hours', 'virtual', 1)", [U.patA, U.doc1]) ?? ""));
const takenSlot = (await su("select starts_at from public.appointments where id = $1", [apptId]))[0].starts_at.toISOString();
ok("two patients cannot take the same slot", /duplicate key|unique constraint/i.test(await fails("patB", "select public.request_appointment($1, $2::timestamptz, 'virtual')", [U.doc1, takenSlot]) ?? ""));
ok("a missing time is refused cleanly", /later time/.test(await fails("patA", "select public.request_appointment($1, null, 'virtual')", [U.doc1]) ?? ""));
ok("an unverified specialist cannot be booked", /not available/.test(await fails("patA", "select public.request_appointment($1, $2::timestamptz, 'virtual')", [U.doc3, slot(5)]) ?? ""));
ok("a past or imminent time is refused", /later time/.test(await fails("patA", "select public.request_appointment($1, $2::timestamptz, 'virtual')", [U.doc1, slot(0.1)]) ?? ""));

const [{ confirm_appointment: code }] = await as("doc1", "select public.confirm_appointment($1) as confirm_appointment", [apptId]);
ok("confirming returns a video link code", /^[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{3}$/.test(code), code);
ok("confirming sets the status and creates the consent row", (await su("select a.status, c.granted from public.appointments a join public.consents c on c.patient_id = a.patient_id and c.grantee_id = a.specialist_id where a.id = $1", [apptId]))[0]?.granted === true);
const rem = await su("select user_id, due_at > now() as future from public.notifications where related_id = $1 and kind = 'reminder'", [apptId]);
ok("reminders are queued for BOTH people (2 h and 15 min ahead for a visit in 3 h)", rem.filter((r) => r.user_id === U.patA).length === 2 && rem.filter((r) => r.user_id === U.doc1).length === 2 && rem.every((r) => r.future));
ok("future reminders are not visible to the patient yet", (await as("patA", "select id from public.notifications where kind = 'reminder'")).length === 0);
ok("the confirmation notice is visible to the patient now", (await as("patA", "select id from public.notifications where kind = 'booking_confirmed'")).length === 1);

const file = (await as("doc1", "select public.open_patient_file($1) as f", [U.patA]))[0].f;
ok("after confirming, the doctor can open the file", file.name === "Wanjiru Njoroge" && file.conditions.includes("Lupus (SLE)") && file.allergies.includes("penicillin"));
const fileText = JSON.stringify(file);
ok("the file never contains ID, KYC or the patient's own phone number", !/id_last4|id_number|id_type|id_hash|kyc|selfie|phone_e164|254712000001|hash-A/.test(fileText), fileText.slice(0, 200));
ok("the file does include the masked emergency contact a doctor needs", file.emergency_contact?.name === "Mary");
const trail = await as("patA", "select action from public.audit_log where action like 'Opened patient file%'");
ok("the patient sees that the doctor opened their file (logged in the same call)", trail.length === 1);
ok("another specialist cannot open the file", /no access/.test(await fails("doc2", "select public.open_patient_file($1)", [U.patA]) ?? ""));
ok("another patient cannot open the file", /no access/.test(await fails("patB", "select public.open_patient_file($1)", [U.patA]) ?? ""));
ok("the admin cannot open a patient's clinical file", /no access/.test(await fails("adm", "select public.open_patient_file($1)", [U.patA]) ?? ""));
ok("a patient cannot read the private helper functions", /permission denied/.test(await fails("patA", "select private.has_file_access($1, $2)", [U.patA, U.doc1]) ?? ""));
ok("a user cannot forge an audit entry", /permission denied/.test(await fails("doc1", "select private.log($1, 'fake')", [U.patA]) ?? "") && /permission denied/.test(await fails("doc1", "insert into public.audit_log (actor_role, action) values ('x', 'y')") ?? ""));

await as("patA", "select public.set_file_access($1, false)", [U.doc1]);
ok("when the patient withdraws access, the doctor is locked out", /no access/.test(await fails("doc1", "select public.open_patient_file($1)", [U.patA]) ?? ""));
await as("patA", "select public.set_file_access($1, true)", [U.doc1]);
ok("when the patient allows it again, access returns", (await as("doc1", "select public.open_patient_file($1) as f", [U.patA]))[0].f.name === "Wanjiru Njoroge");
ok("the withdrawal and the re-allow are both in the patient's log", (await as("patA", "select action from public.audit_log where action like 'Access%'")).length === 2);

console.log("\nVisit, summary and prescription");
ok("only the booked doctor can complete the visit", /not your booking/.test(await fails("doc2", "select public.complete_consultation($1, 'x', null, 12, '{}')", [apptId]) ?? ""));
const [{ rx }] = await as("doc1", "select public.complete_consultation($1, 'Joint pain improved. Continue treatment.', 'private working note', 12, array['Kidney panel'], $2::jsonb) as rx",
  [apptId, JSON.stringify([{ drug: "Hydroxychloroquine", dose: "200 mg daily", qty: 30 }])]);
ok("completing a visit with a prescription returns a code", /^RX-[0-9A-F]{6}$/.test(rx), rx);
ok("the patient reads the summary", (await as("patA", "select summary from public.consultations"))[0]?.summary.startsWith("Joint pain"));
ok("the author reads their own consultation, including private notes", (await as("doc1", "select clinical_notes from public.consultations"))[0]?.clinical_notes === "private working note");
ok("another specialist cannot read the consultation", (await as("doc2", "select * from public.consultations")).length === 0);
const fileAfter = (await as("doc1", "select public.open_patient_file($1) as f", [U.patA]))[0].f;
ok("the shared file shows the summary but never the private notes", fileAfter.visits.length === 1 && !/private working note/.test(JSON.stringify(fileAfter)));
ok("the patient sees the prescription; others do not", (await as("patA", "select id from public.prescriptions")).length === 1 && (await as("patB", "select id from public.prescriptions")).length === 0 && (await as("doc2", "select id from public.prescriptions")).length === 0);
const rxId = (await su("select id from public.prescriptions"))[0].id;
ok("another patient cannot choose the pharmacy", /not found/.test(await fails("patB", "select public.choose_pharmacy($1, 'X')", [rxId]) ?? ""));
ok("collecting before choosing is refused", /not shared/.test(await fails("patA", "select public.collect_prescription($1)", [rxId]) ?? ""));
await su("update public.prescriptions set created_at = now() - interval '30 hours' where id = $1", [rxId]);
ok("reminders are due for a prescription nobody has picked up (1 h and 24 h)", (await su("select public.rx_reminder_tick() as n"))[0].n === 2);
ok("the reminder job is idempotent", (await su("select public.rx_reminder_tick() as n"))[0].n === 0);
ok("a signed-in user cannot run the reminder job", /permission denied/.test(await fails("patA", "select public.rx_reminder_tick()") ?? ""));
await as("patA", "select public.choose_pharmacy($1, 'Tumaini Pharmacy')", [rxId]);
await su("update public.prescriptions set created_at = now() - interval '400 hours' where id = $1", [rxId]);
ok("reminders stop once the patient has chosen a pharmacy", (await su("select public.rx_reminder_tick() as n"))[0].n === 0);
await as("patA", "select public.collect_prescription($1)", [rxId]);
ok("the patient can mark it collected", (await su("select status from public.prescriptions where id = $1", [rxId]))[0].status === "collected");

console.log("\nAccess lapses and cancellations");
ok("the doctor keeps access for 90 days after a completed visit", (await as("doc1", "select public.open_patient_file($1) as f", [U.patA]))[0].f.name === "Wanjiru Njoroge");
await su("update public.appointments set starts_at = now() - interval '91 days' where id = $1", [apptId]);
ok("after 90 days it lapses", /no access/.test(await fails("doc1", "select public.open_patient_file($1)", [U.patA]) ?? ""));
const [{ request_appointment: second }] = await as("patA", "select public.request_appointment($1, $2::timestamptz, 'physical') as request_appointment", [U.doc2, slot(30)]);
await as("doc2", "select public.confirm_appointment($1)", [second]);
ok("a 30-hour visit schedules all three reminders per person", (await su("select count(*)::int c from public.notifications where related_id = $1 and kind = 'reminder'", [second]))[0].c === 6);
ok("the second doctor now has access", (await as("doc2", "select public.open_patient_file($1) as f", [U.patA]))[0].f.name === "Wanjiru Njoroge");
await as("patA", "select public.cancel_appointment($1)", [second]);
ok("cancelling removes the pending reminders", (await su("select count(*)::int c from public.notifications where related_id = $1 and kind = 'reminder' and sent_at is null", [second]))[0].c === 0);
ok("and closes the doctor's access", /no access/.test(await fails("doc2", "select public.open_patient_file($1)", [U.patA]) ?? ""));
const [{ request_appointment: third }] = await as("patB", "select public.request_appointment($1, $2::timestamptz, 'virtual') as request_appointment", [U.doc1, slot(6)]);
await as("doc1", "select public.decline_appointment($1, 'Not available')", [third]);
ok("declining releases the payment", (await su("select status, payment_state from public.appointments where id = $1", [third]))[0].payment_state === "released");
ok("a declined booking gives the doctor no file access", /no access/.test(await fails("doc1", "select public.open_patient_file($1)", [U.patB]) ?? ""));

console.log("\nAdmin and the audit trail");
ok("only an admin can review an ID", /admins only/.test(await fails("doc1", "select public.review_kyc($1, true)", [U.patA]) ?? "") && /admins only/.test(await fails("patA", "select public.review_kyc($1, true)", [U.patA]) ?? ""));
await as("adm", "select public.review_kyc($1, true)", [U.patA]);
ok("approving an ID shows doctors a verified badge", (await as("doc1", "select id_verified from public.specialist_schedule() where patient_id = $1 limit 1", [U.patA]))[0]?.id_verified === true);
ok("the audit log cannot be altered, even by the table owner", /append-only/.test(await fails("adm", "select 1 where false") ?? "append-only") && /append-only/.test(String(await db.exec("update public.audit_log set action = 'x'").catch((e) => e.message))));
ok("a patient cannot edit or delete the audit log", /permission denied/.test(await fails("patA", "delete from public.audit_log") ?? ""));

console.log("\nPatient rights");
const rec = (await as("patA", "select public.download_my_record() as r"))[0].r;
ok("a patient can download their whole record (without the ID hash)", rec.name === "Wanjiru Njoroge" && rec.identity.id_last4 === "5678" && !("id_number_hash" in rec.identity) && Array.isArray(rec.access_log));
ok("a doctor cannot download someone's record", /patients only/.test(await fails("doc1", "select public.download_my_record()") ?? ""));
await as("patA", "select public.delete_my_account()");
ok("deleting erases identity, health and consent rows", (await su("select (select count(*) from public.patient_identity where patient_id = $1) + (select count(*) from public.patient_health where patient_id = $1) + (select count(*) from public.consents where patient_id = $1) as n", [U.patA]))[0].n == 0);
ok("the name is erased and the audit trail is kept", (await su("select full_name from public.profiles where id = $1", [U.patA]))[0].full_name === "Deleted user" && (await su("select count(*)::int c from public.audit_log where patient_id = $1", [U.patA]))[0].c > 3);
ok("the summary text is erased too", (await su("select summary from public.consultations where patient_id = $1", [U.patA]))[0].summary.startsWith("[erased"));

console.log("\nCapturing everything the app does");
const CLIENT_A = "11111111-1111-4111-8111-111111111111", CLIENT_B = "22222222-2222-4222-8222-222222222222";
const cap = (who, client, action = "book", payload = { specialistId: "sp-amina" }) => as(who, "select public.capture_event($1::uuid, 'patient', $2, $3::jsonb, 'pt-1', false, '1.0')", [client, action, JSON.stringify(payload)]);
await cap("anon", CLIENT_A);
ok("a visitor with no login can record an action", (await su("select count(*)::int c from public.app_events where client_id = $1 and action = 'book'", [CLIENT_A]))[0].c === 1);
ok("the action, role and details are stored", (await su("select actor, patient_id, payload->>'specialistId' as s from public.app_events where client_id = $1", [CLIENT_A]))[0].s === "sp-amina");
ok("a visitor cannot read captured rows back", /permission denied/.test(await fails("anon", "select * from public.app_events") ?? ""));
ok("a signed-in patient cannot read them either", /permission denied/.test(await fails("patB", "select * from public.app_events") ?? ""));
ok("nobody can write the table directly", /permission denied/.test(await fails("anon", "insert into public.app_events (client_id, actor, action) values (gen_random_uuid(), 'patient', 'x')") ?? ""));
ok("nobody can change or delete rows directly", /permission denied/.test(await fails("anon", "delete from public.app_events") ?? "") && /permission denied/.test(await fails("patB", "update public.app_events set action = 'x'") ?? ""));
ok("a made-up action name is refused", /bad action/.test(await fails("anon", "select public.capture_event($1::uuid, 'patient', 'drop table;--', '{}', null, false, null)", [CLIENT_A]) ?? ""));
ok("a made-up role is refused", /bad actor/.test(await fails("anon", "select public.capture_event($1::uuid, 'Robert; drop', 'book', '{}', null, false, null)", [CLIENT_A]) ?? ""));
ok("an oversized payload is refused", /payload too large/.test(await fails("anon", "select public.capture_event($1::uuid, 'patient', 'book', jsonb_build_object('x', repeat('a', 40000)), null, false, null)", [CLIENT_A]) ?? ""));
ok("a missing client id is refused", /client id required/.test(await fails("anon", "select public.capture_event(null, 'patient', 'book', '{}', null, false, null)") ?? ""));
for (let i = 0; i < 199; i++) await cap("anon", CLIENT_B, "usePatient", { n: i });
ok("200 actions a minute are accepted", (await su("select count(*)::int c from public.app_events where client_id = $1", [CLIENT_B]))[0].c === 199);
await cap("anon", CLIENT_B, "usePatient", { n: 199 });
ok("the 201st in a minute is refused (slow down)", /slow down/.test(await fails("anon", "select public.capture_event($1::uuid, 'patient', 'book', '{}', null, false, null)", [CLIENT_B]) ?? ""));
ok("one browser slowing down does not block another", await fails("anon", "select public.capture_event($1::uuid, 'patient', 'book', '{}', null, false, null)", [CLIENT_A]) === null);
const erased = (await as("anon", "select public.erase_capture($1::uuid) as n", [CLIENT_B]))[0].n;
ok("erasing removes that browser's rows only (" + erased + ")", erased === 200 && (await su("select count(*)::int c from public.app_events where client_id = $1", [CLIENT_B]))[0].c === 0 && (await su("select count(*)::int c from public.app_events where client_id = $1", [CLIENT_A]))[0].c >= 1);

console.log("\nStructural checks");
ok("every public table has row level security on", (await su("select count(*)::int c from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity"))[0].c === 0);
ok("no signed-in user can insert, update or delete on any table", (await su(`select count(*)::int c from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'
  and (has_table_privilege('authenticated', c.oid, 'INSERT') or has_table_privilege('authenticated', c.oid, 'UPDATE') or has_table_privilege('authenticated', c.oid, 'DELETE') or has_table_privilege('anon', c.oid, 'SELECT') and c.relname <> 'specialists')`))[0].c === 0);
ok("every security-definer function pins its search_path", (await su("select count(*)::int c from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'private') and p.prosecdef and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) s where s like 'search_path=%'))"))[0].c === 0);
ok("anonymous visitors can execute only the two capture functions", (await su("select string_agg(p.proname, ',' order by p.proname) names from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')"))[0].names === "capture_event,erase_capture");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
