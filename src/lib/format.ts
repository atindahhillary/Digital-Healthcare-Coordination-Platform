export const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

export const time = (d: string | Date) => new Date(d).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

export const date = (d: string | Date) => new Date(d).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });

export const dateTime = (d: string | Date) => `${date(d)}, ${time(d)}`;

export function ago(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  const unit = m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
  if (m < 1) return "just now";
  return diff >= 0 ? `${unit} ago` : `in ${unit}`;
}

export function minutesUntil(d: string | Date) {
  return Math.round((new Date(d).getTime() - Date.now()) / 60000);
}

export const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// "SMS + App" style label for a notice that went out on more than one channel.
export function channelLabel(n: { channel: string; also?: string[] }) {
  const name = (c: string) => (c === "sms" ? "SMS" : c === "app" ? "App" : c === "whatsapp" ? "WhatsApp" : c);
  return [n.channel, ...(n.also ?? [])].map(name).join(" + ");
}
