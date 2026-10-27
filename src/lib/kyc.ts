import type { Kyc } from "../store/store";

// Kenyan mobile numbers: 07XX / 01XX / +2547XX / +2541XX followed by 6 digits.
export function normalisePhone(raw: string): string | null {
  const d = raw.replace(/[\s\-().]/g, "");
  const m = d.match(/^(?:\+?254|0)([71]\d{8})$/);
  return m ? `+254${m[1]}` : null;
}

export const maskPhone = (p: string) => `${p.slice(0, 4)} ${p[4]}•• ••• ${p.slice(-3)}`;

export const maskId = (v: string) => `••••${v.replace(/\s/g, "").slice(-4)}`;

export function ageFromDob(dob: string, now = new Date()): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return -1;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function validateId(type: Kyc["idType"], value: string): string {
  const v = value.trim().toUpperCase();
  if (!v) return "Enter your ID number";
  switch (type) {
    case "National ID": return /^\d{7,8}$/.test(v) ? "" : "A national ID number has 7 or 8 digits";
    case "Passport": return /^[A-Z0-9]{6,9}$/.test(v) ? "" : "A passport number has 6 to 9 letters or digits";
    case "Alien ID": return /^\d{6,9}$/.test(v) ? "" : "An alien ID number has 6 to 9 digits";
    case "Birth certificate": return /^[A-Z0-9/-]{4,20}$/.test(v) ? "" : "Check the birth certificate number";
  }
}

export const ID_TYPES: Kyc["idType"][] = ["National ID", "Passport", "Alien ID", "Birth certificate"];

export const CONDITION_OPTIONS = [
  "Lupus (SLE)", "Rheumatoid arthritis", "Type 2 diabetes", "Type 1 diabetes", "Hypertension", "Chronic kidney disease",
  "Heart disease", "Asthma", "Epilepsy", "Thyroid disease", "Sickle cell disease",
];

export const BLOOD_GROUPS = ["Not sure", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export const splitList = (s: string) => s.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean);
