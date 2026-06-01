import { Scheme, MonthlyProgress, AuditLog, SchemeNotification } from "./types";

export const INITIAL_SCHEMES: Scheme[] = [
  {
    id: "pmayg",
    name: "PMAY-G (Pradhan Mantri Awas Yojana - Gramin)",
    code: "SCH-PMAYG",
    department: "Rural Development Department",
    category: "Rural Development",
    description: "Providing quality housing with basic amenities to all homeless and households living in dilapidated houses in rural areas.",
    reportingFrequency: "Monthly"
  },
  {
    id: "jjm",
    name: "JJM (Jal Jeevan Mission - Har Ghar Nal Ka Jal)",
    code: "SCH-JJM",
    department: "Public Health Engineering Department",
    category: "Water & Sanitation",
    description: "Providing functional household tap connections (FHTC) to every rural household, ensuring safe and adequate drinking water.",
    reportingFrequency: "Monthly"
  },
  {
    id: "mgnrega",
    name: "MGNREGA (National Rural Employment Guarantee Scheme)",
    code: "SCH-MGNREGA",
    department: "Rural Development Department",
    category: "Rural Development",
    description: "Guaranteeing 100 days of wage employment per year to rural households to enhance livelihood security.",
    reportingFrequency: "Monthly"
  },
  {
    id: "nhm",
    name: "NHM (National Health Mission)",
    code: "SCH-NHM",
    department: "Health Department",
    category: "Health",
    description: "Providing universal access to equitable, affordable and quality health care services that are responsive to people's needs.",
    reportingFrequency: "Monthly"
  },
  {
    id: "samagra",
    name: "Samagra Shiksha (Rural Education Upliftment)",
    code: "SCH-SAMAGRA",
    department: "Education Department",
    category: "Education",
    description: "Support scheme for schools aiming to provide inclusive, equitable, quality primary and secondary education.",
    reportingFrequency: "Monthly"
  },
  {
    id: "icds",
    name: "ICDS (Integrated Child Development Services)",
    code: "SCH-ICDS",
    department: "Social Welfare Department",
    category: "Social Welfare",
    description: "Providing food, preschool education, primary healthcare, immunization, and health checkups to infants and mothers.",
    reportingFrequency: "Monthly"
  }
];

export const INITIAL_SUBMISSIONS: MonthlyProgress[] = [];

export const INITIAL_NOTIFICATIONS: SchemeNotification[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
