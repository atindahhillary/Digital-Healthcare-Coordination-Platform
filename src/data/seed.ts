// Demo data for the clickable prototype. Every person, clinic, laboratory and
// pharmacy below is fictional. Registration numbers are placeholders, not real
// KMPDC, PPB or KMLTTB numbers.

export type Mode = "virtual" | "physical";

export interface Specialist {
  id: string;
  name: string;
  title: string;
  specialty: string;
  clinic: string;
  county: string;
  town: string;
  fee: number;
  virtualFee: number;
  modes: Mode[];
  languages: string[];
  rating: number;
  reviews: number;
  punctuality: number; // % of consults started within 10 min of booked time
  avgWait: number; // minutes
  verified: boolean;
  regNo: string;
  years: number;
  conditions: string[];
  bio: string;
  hue: number;
}

export interface LabTest {
  code: string;
  name: string;
  price: number;
  tat: string;
}

export interface Lab {
  id: string;
  name: string;
  county: string;
  homeCollection: boolean;
  accreditation: string;
  tests: LabTest[];
}

export interface Pharmacy {
  id: string;
  name: string;
  county: string;
  areas: string[];
  delivery: boolean;
  hours: string;
}

export interface PathwayStep {
  label: string;
  kind: "consult" | "lab" | "medication" | "screening" | "education";
  everyWeeks: number;
  detail: string;
}

export interface Pathway {
  id: string;
  name: string;
  short: string;
  lead: string;
  colour: string;
  summary: string;
  team: string[];
  steps: PathwayStep[];
  redFlags: string[];
}

export interface PatientOrg {
  id: string;
  name: string;
  focus: string;
  members: number;
}

export const SPECIALTIES = [
  "Rheumatology",
  "Nephrology",
  "Endocrinology",
  "Cardiology",
  "Ophthalmology",
  "Internal Medicine",
  "Neurology",
  "Psychiatry",
] as const;

export const COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Uasin Gishu", "Machakos", "Kajiado"] as const;

export const specialists: Specialist[] = [
  { id: "sp-amina", name: "Dr. Amina Odhiambo", title: "Consultant Rheumatologist", specialty: "Rheumatology", clinic: "Upper Hill Joint & Immunity Clinic", county: "Nairobi", town: "Upper Hill", fee: 4500, virtualFee: 3500, modes: ["virtual", "physical"], languages: ["English", "Kiswahili", "Dholuo"], rating: 4.9, reviews: 212, punctuality: 97, avgWait: 6, verified: true, regNo: "DEMO-MP-10421", years: 14, conditions: ["Lupus (SLE)", "Rheumatoid arthritis", "Gout", "Vasculitis"], bio: "Leads a lupus follow-up clinic with shared care plans for kidney monitoring and medication safety.", hue: 168 },
  { id: "sp-kiprono", name: "Dr. Brian Kiprono", title: "Rheumatologist", specialty: "Rheumatology", clinic: "Rift Valley Specialist Centre", county: "Uasin Gishu", town: "Eldoret", fee: 3800, virtualFee: 3000, modes: ["virtual", "physical"], languages: ["English", "Kiswahili", "Kalenjin"], rating: 4.8, reviews: 131, punctuality: 94, avgWait: 9, verified: true, regNo: "DEMO-MP-11873", years: 9, conditions: ["Lupus (SLE)", "Ankylosing spondylitis", "Rheumatoid arthritis"], bio: "Runs virtual follow-ups for patients across the North Rift so stable patients travel less.", hue: 200 },
  { id: "sp-njeri", name: "Dr. Njeri Mwangi", title: "Consultant Nephrologist", specialty: "Nephrology", clinic: "Westlands Kidney Care", county: "Nairobi", town: "Westlands", fee: 5000, virtualFee: 4000, modes: ["virtual", "physical"], languages: ["English", "Kiswahili", "Gikuyu"], rating: 4.9, reviews: 176, punctuality: 96, avgWait: 7, verified: true, regNo: "DEMO-MP-09344", years: 16, conditions: ["Lupus nephritis", "Chronic kidney disease", "Hypertension"], bio: "Co-manages lupus nephritis with rheumatology through one shared plan.", hue: 220 },
  { id: "sp-hassan", name: "Dr. Hassan Ali", title: "Endocrinologist", specialty: "Endocrinology", clinic: "Coast Diabetes & Hormone Centre", county: "Mombasa", town: "Nyali", fee: 4000, virtualFee: 3000, modes: ["virtual", "physical"], languages: ["English", "Kiswahili", "Arabic"], rating: 4.7, reviews: 158, punctuality: 91, avgWait: 11, verified: true, regNo: "DEMO-MP-12209", years: 11, conditions: ["Type 2 diabetes", "Type 1 diabetes", "Thyroid disease"], bio: "Focuses on HbA1c follow-up and insulin start in partnership with community pharmacies.", hue: 28 },
  { id: "sp-otieno", name: "Dr. Kevin Otieno", title: "Cardiologist", specialty: "Cardiology", clinic: "Lakeside Heart Clinic", county: "Kisumu", town: "Milimani", fee: 4500, virtualFee: 3500, modes: ["physical", "virtual"], languages: ["English", "Kiswahili", "Dholuo"], rating: 4.8, reviews: 98, punctuality: 93, avgWait: 10, verified: true, regNo: "DEMO-MP-13355", years: 12, conditions: ["Hypertension", "Heart failure", "Rheumatic heart disease"], bio: "Hypertension and heart failure follow-up with home blood pressure review.", hue: 350 },
  { id: "sp-wairimu", name: "Dr. Faith Wairimu", title: "Ophthalmologist", specialty: "Ophthalmology", clinic: "Thika Road Eye Centre", county: "Kiambu", town: "Ruiru", fee: 3500, virtualFee: 0, modes: ["physical"], languages: ["English", "Kiswahili", "Gikuyu"], rating: 4.8, reviews: 143, punctuality: 95, avgWait: 8, verified: true, regNo: "DEMO-MP-14012", years: 10, conditions: ["Hydroxychloroquine eye screening", "Diabetic retinopathy", "Glaucoma"], bio: "Annual retinal screening for patients on hydroxychloroquine and people living with diabetes.", hue: 260 },
  { id: "sp-chebet", name: "Dr. Mercy Chebet", title: "Physician (Internal Medicine)", specialty: "Internal Medicine", clinic: "Nakuru Chronic Care Clinic", county: "Nakuru", town: "Milimani", fee: 3000, virtualFee: 2500, modes: ["virtual", "physical"], languages: ["English", "Kiswahili", "Kalenjin"], rating: 4.7, reviews: 201, punctuality: 92, avgWait: 12, verified: true, regNo: "DEMO-MP-15120", years: 8, conditions: ["Hypertension", "Type 2 diabetes", "Lupus (SLE)", "Multimorbidity"], bio: "General physician for multimorbidity, with a step-up route to specialists through tracked referral.", hue: 140 },
  { id: "sp-mutua", name: "Dr. Daniel Mutua", title: "Neurologist", specialty: "Neurology", clinic: "Machakos Neuro Clinic", county: "Machakos", town: "Machakos", fee: 4800, virtualFee: 3800, modes: ["virtual", "physical"], languages: ["English", "Kiswahili", "Kikamba"], rating: 4.6, reviews: 77, punctuality: 89, avgWait: 14, verified: true, regNo: "DEMO-MP-16031", years: 7, conditions: ["Epilepsy", "Stroke follow-up", "Migraine"], bio: "Epilepsy and stroke follow-up for Machakos and Makueni.", hue: 45 },
  { id: "sp-achieng", name: "Dr. Lilian Achieng", title: "Consultant Psychiatrist", specialty: "Psychiatry", clinic: "Kilimani Mind Health", county: "Nairobi", town: "Kilimani", fee: 5000, virtualFee: 4000, modes: ["virtual", "physical"], languages: ["English", "Kiswahili"], rating: 4.9, reviews: 119, punctuality: 98, avgWait: 4, verified: true, regNo: "DEMO-MP-11098", years: 13, conditions: ["Depression in chronic illness", "Anxiety", "Bipolar disorder"], bio: "Supports people managing the emotional load of long-term illness.", hue: 300 },
  { id: "sp-sankale", name: "Dr. Peter Sankale", title: "Nephrologist", specialty: "Nephrology", clinic: "Kitengela Renal Unit", county: "Kajiado", town: "Kitengela", fee: 4200, virtualFee: 3200, modes: ["virtual", "physical"], languages: ["English", "Kiswahili", "Maa"], rating: 4.7, reviews: 64, punctuality: 90, avgWait: 12, verified: false, regNo: "DEMO-MP-17450", years: 6, conditions: ["Chronic kidney disease", "Lupus nephritis"], bio: "New to the network. Credentials are under verification.", hue: 190 },
];

export const labs: Lab[] = [
  {
    id: "lab-bora", name: "Bora Diagnostics, Ngara", county: "Nairobi", homeCollection: true, accreditation: "ISO 15189 (demo)",
    tests: [
      { code: "UEC", name: "Urea, electrolytes & creatinine (with eGFR)", price: 1800, tat: "Same day" },
      { code: "UPCR", name: "Urine protein:creatinine ratio", price: 1500, tat: "24 h" },
      { code: "CBC", name: "Complete blood count", price: 900, tat: "Same day" },
      { code: "C3C4", name: "Complement C3 & C4", price: 4200, tat: "48 h" },
      { code: "DSDNA", name: "Anti-dsDNA antibodies", price: 3800, tat: "72 h" },
      { code: "HBA1C", name: "HbA1c", price: 1600, tat: "Same day" },
      { code: "LIPID", name: "Lipid profile", price: 1700, tat: "Same day" },
      { code: "UA", name: "Urinalysis", price: 500, tat: "Same day" },
    ],
  },
  {
    id: "lab-pwani", name: "Pwani Path Labs", county: "Mombasa", homeCollection: true, accreditation: "ISO 15189 (demo)",
    tests: [
      { code: "HBA1C", name: "HbA1c", price: 1500, tat: "Same day" },
      { code: "UEC", name: "Urea, electrolytes & creatinine (with eGFR)", price: 1700, tat: "Same day" },
      { code: "UACR", name: "Urine albumin:creatinine ratio", price: 1600, tat: "24 h" },
      { code: "LIPID", name: "Lipid profile", price: 1600, tat: "Same day" },
    ],
  },
  {
    id: "lab-ziwa", name: "Ziwa Medical Laboratory", county: "Kisumu", homeCollection: false, accreditation: "KMLTTB licensed (demo)",
    tests: [
      { code: "CBC", name: "Complete blood count", price: 800, tat: "Same day" },
      { code: "UEC", name: "Urea, electrolytes & creatinine (with eGFR)", price: 1600, tat: "Same day" },
      { code: "BNP", name: "NT-proBNP", price: 4500, tat: "48 h" },
    ],
  },
];

export const pharmacies: Pharmacy[] = [
  { id: "ph-tumaini", name: "Tumaini Pharmacy, Kasarani", county: "Nairobi", areas: ["Kasarani", "Roysambu", "Ruiru", "Thika Road"], delivery: true, hours: "7am to 10pm daily" },
  { id: "ph-afya", name: "AfyaPlus Chemists, Nyali", county: "Mombasa", areas: ["Nyali", "Bamburi", "Mombasa CBD"], delivery: true, hours: "8am to 9pm daily" },
  { id: "ph-lakeview", name: "Lakeview Pharmacy", county: "Kisumu", areas: ["Milimani", "Kondele", "Nyalenda"], delivery: false, hours: "8am to 8pm, Mon to Sat" },
];

export const patientOrgs: PatientOrg[] = [
  { id: "org-lupus", name: "Lupus Warriors Support Network", focus: "Lupus and related autoimmune conditions", members: 512 },
  { id: "org-diabetes", name: "Sweet Life Diabetes Circle", focus: "Type 1 and type 2 diabetes", members: 1340 },
];

export const pathways: Pathway[] = [
  {
    id: "lupus", name: "Lupus (SLE) care pathway", short: "Lupus", lead: "Rheumatology", colour: "#7C3AED",
    summary: "Regular rheumatology review, kidney monitoring, medication safety and peer support, coordinated in one plan.",
    team: ["Rheumatologist", "Nephrologist (if kidneys involved)", "Ophthalmologist", "Laboratory", "Pharmacy", "Care coordinator", "Patient organisation"],
    steps: [
      { label: "Rheumatology review", kind: "consult", everyWeeks: 12, detail: "Disease activity, medication review, side effects." },
      { label: "Kidney function panel", kind: "lab", everyWeeks: 12, detail: "UEC with eGFR, urinalysis and urine protein:creatinine ratio." },
      { label: "Full blood count", kind: "lab", everyWeeks: 12, detail: "Monitors blood counts while on treatment." },
      { label: "Hydroxychloroquine refill", kind: "medication", everyWeeks: 4, detail: "Monthly refill with pharmacist check." },
      { label: "Retinal eye screening", kind: "screening", everyWeeks: 52, detail: "Annual screening while on hydroxychloroquine." },
      { label: "Support group session", kind: "education", everyWeeks: 4, detail: "Monthly peer session with the patient organisation." },
    ],
    redFlags: ["Swelling of legs or face, or foamy urine", "Chest pain or difficulty breathing", "High fever while on immune-suppressing medicine", "Seizures or sudden confusion"],
  },
  {
    id: "diabetes", name: "Type 2 diabetes pathway", short: "Diabetes", lead: "Endocrinology", colour: "#EA580C",
    summary: "HbA1c every three months, yearly eye, foot and kidney checks, and dependable medicine supply.",
    team: ["Endocrinologist or physician", "Ophthalmologist", "Laboratory", "Pharmacy", "Nutrition educator", "Care coordinator"],
    steps: [
      { label: "Diabetes review", kind: "consult", everyWeeks: 12, detail: "Glucose log, medication and lifestyle review." },
      { label: "HbA1c", kind: "lab", everyWeeks: 12, detail: "Three-month glucose control." },
      { label: "Kidney check (UACR + eGFR)", kind: "lab", everyWeeks: 52, detail: "Yearly kidney screening." },
      { label: "Diabetic eye screening", kind: "screening", everyWeeks: 52, detail: "Yearly retinal photography." },
      { label: "Medicine refill", kind: "medication", everyWeeks: 4, detail: "Metformin and other medicines as prescribed." },
    ],
    redFlags: ["Very high or very low sugar readings with confusion", "A foot wound that is not healing", "Vomiting and unable to keep fluids down"],
  },
  {
    id: "hypertension", name: "Hypertension pathway", short: "Hypertension", lead: "Cardiology / Internal Medicine", colour: "#DC2626",
    summary: "Home blood pressure readings, regular review and kidney checks to prevent stroke and heart disease.",
    team: ["Physician or cardiologist", "Laboratory", "Pharmacy", "Care coordinator"],
    steps: [
      { label: "Blood pressure review", kind: "consult", everyWeeks: 12, detail: "Review home readings and medicines." },
      { label: "Kidney function and lipids", kind: "lab", everyWeeks: 52, detail: "Yearly UEC and lipid profile." },
      { label: "Medicine refill", kind: "medication", everyWeeks: 4, detail: "Monthly refill." },
    ],
    redFlags: ["Severe headache with vision changes", "Weakness on one side of the body or slurred speech", "Chest pain"],
  },
  {
    id: "ckd", name: "Chronic kidney disease pathway", short: "Kidney disease", lead: "Nephrology", colour: "#2563EB",
    summary: "Kidney function trends, blood pressure control and medicine safety, shared between nephrology and primary care.",
    team: ["Nephrologist", "Physician", "Laboratory", "Pharmacy", "Dietitian", "Care coordinator"],
    steps: [
      { label: "Nephrology review", kind: "consult", everyWeeks: 12, detail: "Stage-based review." },
      { label: "UEC with eGFR + UACR", kind: "lab", everyWeeks: 12, detail: "Tracks kidney function over time." },
      { label: "Medicine refill", kind: "medication", everyWeeks: 4, detail: "With kidney-safe dose checks." },
    ],
    redFlags: ["Passing very little urine", "Breathlessness or swelling", "Severe weakness or palpitations"],
  },
];

// Deterministic pseudo-random so slot availability is stable between renders.
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function slotsFor(sp: Specialist, day: Date, taken: string[] = []): Date[] {
  const out: Date[] = [];
  const dow = day.getDay();
  if (dow === 0) return out;
  const endHour = dow === 6 ? 13 : 17;
  for (let h = 8; h < endHour; h++) {
    for (const m of [0, 30]) {
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      if (d.getTime() < Date.now() + 30 * 60000) continue;
      if (hash(sp.id + d.toISOString()) < 0.45) continue;
      if (taken.includes(d.toISOString())) continue;
      out.push(d);
    }
  }
  return out;
}

// Illustrative stock photos (Unsplash licence). The people pictured are models,
// not the fictional doctors named here.
const PHOTOS: Record<string, string> = {
  "Amina Odhiambo": "dr-amina", "Brian Kiprono": "dr-kiprono", "Njeri Mwangi": "dr-njeri", "Hassan Ali": "dr-hassan",
  "Kevin Otieno": "dr-otieno", "Faith Wairimu": "dr-wairimu", "Mercy Chebet": "dr-chebet", "Daniel Mutua": "dr-mutua",
  "Lilian Achieng": "dr-achieng", "Peter Sankale": "dr-sankale",
};
export const photoOf = (name: string) => {
  const key = name.replace(/^Dr\.\s*/, "");
  return PHOTOS[key] ? `/img/${PHOTOS[key]}.webp` : undefined;
};

export const byId = <T extends { id: string }>(list: T[], id?: string) => list.find((x) => x.id === id);
