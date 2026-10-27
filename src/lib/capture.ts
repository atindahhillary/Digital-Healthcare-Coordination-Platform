import { FEATURES } from "./features";

// Sends every action the app takes to the database (public.capture_event) so nothing it collects is lost.
// Fire and forget: the app never waits for this and never breaks because of it. Offline, actions queue on the
// device and go out when the connection returns. Deleting an account also deletes what was captured.
// The key below is a publishable key: it can only call the two capture functions (see supabase/migrations/..0300_capture.sql).
const URL = "";
const KEY = "";
const VERSION = "1";

const ID_KEY = "afyaconnect-client";
const QUEUE_KEY = "afyaconnect-capture-queue";
const ERASE_KEY = "afyaconnect-capture-erase";
const MAX_QUEUE = 300;
const MAX_PAYLOAD = 30000;

type Row = { p_client: string; p_actor: string; p_action: string; p_payload: unknown; p_patient: string | null; p_demo: boolean; p_version: string };

const enabled = () => FEATURES.capture && !!URL && !!KEY;

let memoryId: string | undefined;
function clientId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(ID_KEY, id); }
    return id;
  } catch {
    return (memoryId ??= crypto.randomUUID());
  }
}
const readList = <T,>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; } };
const writeList = (key: string, list: unknown[]) => { try { localStorage.setItem(key, JSON.stringify(list.slice(-MAX_QUEUE))); } catch { /* storage unavailable: carry on */ } };

async function post(fn: string, body: unknown): Promise<"ok" | "drop" | "retry"> {
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true });
    if (r.ok) return "ok";
    // a 4xx (other than "try later") means the row itself is bad: drop it instead of retrying for ever
    return r.status >= 400 && r.status < 500 && r.status !== 429 && r.status !== 408 ? "drop" : "retry";
  } catch {
    return "retry";
  }
}

let flushing = false;
export async function flush() {
  if (!enabled() || flushing || !navigator.onLine) return;
  flushing = true;
  try {
    // erasures first, then the queue
    let erase = readList<string>(ERASE_KEY);
    while (erase.length) {
      if ((await post("erase_capture", { p_client: erase[0] })) === "retry") return;
      erase = erase.slice(1);
      writeList(ERASE_KEY, erase);
    }
    let q = readList<Row>(QUEUE_KEY);
    while (q.length) {
      if ((await post("capture_event", q[0])) === "retry") return;
      q = q.slice(1);
      writeList(QUEUE_KEY, q);
    }
  } finally {
    flushing = false;
  }
}

export function capture(action: { type: string } & Record<string, unknown>, ctx: { role: string; patientId?: string; demo: boolean }) {
  if (!enabled()) return;
  const { type, ...rest } = action;
  const size = JSON.stringify(rest).length;
  const row: Row = {
    p_client: clientId(), p_actor: ctx.role, p_action: type,
    p_payload: size > MAX_PAYLOAD ? { truncated: true, bytes: size } : rest,
    p_patient: ctx.patientId ?? null, p_demo: ctx.demo, p_version: VERSION,
  };
  writeList(QUEUE_KEY, [...readList<Row>(QUEUE_KEY), row]);
  void flush();
}

// The patient deleted their account: forget what is queued, erase what was already sent, and start a new anonymous id.
export function eraseCaptured() {
  if (!enabled()) return;
  const id = clientId();
  writeList(QUEUE_KEY, []);
  writeList(ERASE_KEY, [...readList<string>(ERASE_KEY), id]);
  try { localStorage.removeItem(ID_KEY); } catch { /* ignore */ }
  memoryId = undefined;
  void flush();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flush());
  window.setTimeout(() => void flush(), 4000);
}
