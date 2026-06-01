import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI with safety and fallback
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Initialize Supabase with lazy loading to prevent crashes if credentials are not configured yet
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: any = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase Client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.log("Supabase keys not found in environment variables. Falling back to in-memory state.");
}

// Graceful handler for missing table schemas or database connectivity alerts
const handleSupabaseError = (operation: string, error: any) => {
  if (!error) return;
  const msg = error.message || String(error);
  if (msg.includes("Could not find the table") || msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("relation")) {
    console.info(`[Supabase Schema Info] Table for '${operation}' is not yet created in your Supabase database instance. Relying on local in-memory storage fallback.`);
  } else {
    console.log(`[Supabase Info] Optional ${operation} sync status:`, msg);
  }
};

// -----------------------------------------------------
// SEED DATA FOR IN-MEMORY FALLBACK (Satisfies instant 100% working state)
// -----------------------------------------------------

let schemesCache = [
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

let submissionsCache = [
  {
    id: "sub-muz-pmayg-01",
    district: "Muzaffarpur",
    schemeId: "pmayg",
    month: "April",
    year: "2026",
    totalAllocation: 125000000,
    prevBalance: 15400000,
    currentRelease: 109600000,
    expenditureThisMonth: 101200000,
    cumulativeExpenditure: 116600000,
    utilizationPercentage: 93.28,
    targetBeneficiaries: 14500,
    coveredBeneficiaries: 13820,
    remainingBeneficiaries: 680,
    coveragePercentage: 95.31,
    projectsApproved: 14500,
    projectsStarted: 13900,
    projectsCompleted: 11450,
    projectsDelayed: 180,
    staffingSanctioned: 45,
    staffingWorking: 41,
    staffingVacancies: 4,
    complaintsReceived: 34,
    complaintsResolved: 31,
    complaintsPending: 3,
    challenges: "Raw material costs of bricks and cement surged slightly in the central blocks. Minor delay due to land registry checks in Musahari block.",
    remarks: "Excellent progress. Weekly monitoring camps conducted. Completed clusters submitted for certification.",
    status: "Approved",
    createdBy: "Muzaffarpur District Officer",
    createdAt: "2026-04-28T14:32:00Z"
  },
  {
    id: "sub-muz-jjm-01",
    district: "Muzaffarpur",
    schemeId: "jjm",
    month: "April",
    year: "2026",
    totalAllocation: 185000000,
    prevBalance: 42000000,
    currentRelease: 143000000,
    expenditureThisMonth: 125800000,
    cumulativeExpenditure: 147800000,
    utilizationPercentage: 79.89,
    targetBeneficiaries: 48000,
    coveredBeneficiaries: 39500,
    remainingBeneficiaries: 8500,
    coveragePercentage: 82.29,
    projectsApproved: 280,
    projectsStarted: 265,
    projectsCompleted: 215,
    projectsDelayed: 25,
    staffingSanctioned: 32,
    staffingWorking: 28,
    staffingVacancies: 4,
    complaintsReceived: 56,
    complaintsResolved: 48,
    complaintsPending: 8,
    challenges: "Boring failures encountered in 3 locations in Aurai block due to clay pockets. Contractor replaced to expedite work.",
    remarks: "On track to achieve universal connection targets by mid-June 2026.",
    status: "Approved",
    createdBy: "Muzaffarpur District Officer",
    createdAt: "2026-04-29T10:15:00Z"
  },
  {
    id: "sub-sit-pmayg-01",
    district: "Sitamarhi",
    schemeId: "pmayg",
    month: "April",
    year: "2026",
    totalAllocation: 98000000,
    prevBalance: 24000000,
    currentRelease: 74000000,
    expenditureThisMonth: 78500000,
    cumulativeExpenditure: 82500000,
    utilizationPercentage: 84.18,
    targetBeneficiaries: 11000,
    coveredBeneficiaries: 9150,
    remainingBeneficiaries: 1850,
    coveragePercentage: 83.18,
    projectsApproved: 11000,
    projectsStarted: 10400,
    projectsCompleted: 8120,
    projectsDelayed: 410,
    staffingSanctioned: 35,
    staffingWorking: 29,
    staffingVacancies: 6,
    complaintsReceived: 45,
    complaintsResolved: 38,
    complaintsPending: 7,
    challenges: "Labor migration peak observed. A few beneficiaries delayed start due to harvesting season obligations.",
    remarks: "Aggressive visual reviews initiated. Work speed recovering under Special Block Supervisors.",
    status: "Approved",
    createdBy: "Sitamarhi District Officer",
    createdAt: "2026-04-27T09:12:00Z"
  },
  {
    id: "sub-sit-jjm-01",
    district: "Sitamarhi",
    schemeId: "jjm",
    month: "April",
    year: "2026",
    totalAllocation: 110000000,
    prevBalance: 12000000,
    currentRelease: 98000000,
    expenditureThisMonth: 65000000,
    cumulativeExpenditure: 72000000,
    utilizationPercentage: 65.45,
    targetBeneficiaries: 30000,
    coveredBeneficiaries: 21500,
    remainingBeneficiaries: 8500,
    coveragePercentage: 71.67,
    projectsApproved: 195,
    projectsStarted: 160,
    projectsCompleted: 98,
    projectsDelayed: 45,
    staffingSanctioned: 24,
    staffingWorking: 20,
    staffingVacancies: 4,
    complaintsReceived: 78,
    complaintsResolved: 55,
    complaintsPending: 23,
    challenges: "Water table depth variations. Contractor quality issues in Dumra block resulted in slow progress and complaints.",
    remarks: "Warning letters issued to 2 contracting agencies. Daily oversight escalated.",
    status: "Under Review",
    createdBy: "Sitamarhi District Officer",
    createdAt: "2026-04-29T16:45:00Z"
  },
  {
    id: "sub-vsh-pmayg-01",
    district: "Vaishali",
    schemeId: "pmayg",
    month: "April",
    year: "2026",
    totalAllocation: 105000000,
    prevBalance: 9800000,
    currentRelease: 95200000,
    expenditureThisMonth: 91500000,
    cumulativeExpenditure: 96800000,
    utilizationPercentage: 92.19,
    targetBeneficiaries: 13200,
    coveredBeneficiaries: 12690,
    remainingBeneficiaries: 510,
    coveragePercentage: 96.14,
    projectsApproved: 13200,
    projectsStarted: 12900,
    projectsCompleted: 11800,
    projectsDelayed: 90,
    staffingSanctioned: 38,
    staffingWorking: 36,
    staffingVacancies: 2,
    complaintsReceived: 18,
    complaintsResolved: 17,
    complaintsPending: 1,
    challenges: "None of significance. Normal operations progressing efficiently.",
    remarks: "Top performing district for housing progress in April. Public satisfaction is high.",
    status: "Approved",
    createdBy: "Vaishali District Officer",
    createdAt: "2026-04-26T11:00:00Z"
  },
  {
    id: "sub-ech-mgnrega-01",
    district: "East Champaran",
    schemeId: "mgnrega",
    month: "April",
    year: "2026",
    totalAllocation: 195000000,
    prevBalance: 35000000,
    currentRelease: 160000000,
    expenditureThisMonth: 172000000,
    cumulativeExpenditure: 179000000,
    utilizationPercentage: 91.79,
    targetBeneficiaries: 65000,
    coveredBeneficiaries: 60200,
    remainingBeneficiaries: 4800,
    coveragePercentage: 92.62,
    projectsApproved: 1120,
    projectsStarted: 1050,
    projectsCompleted: 915,
    projectsDelayed: 65,
    staffingSanctioned: 60,
    staffingWorking: 54,
    staffingVacancies: 6,
    complaintsReceived: 92,
    complaintsResolved: 86,
    complaintsPending: 6,
    challenges: "Biometric authentication failed in 3 remote wards due to network downtime. Alternates enabled.",
    remarks: "Pond excavation and plantation blocks heavily mobilized during dry month.",
    status: "Approved",
    createdBy: "East Champaran District Officer",
    createdAt: "2026-04-28T18:10:00Z"
  },
  {
    id: "sub-shr-pmayg-01",
    district: "Sheohar",
    schemeId: "pmayg",
    month: "April",
    year: "2026",
    totalAllocation: 38000000,
    prevBalance: 12000000,
    currentRelease: 26000000,
    expenditureThisMonth: 17500000,
    cumulativeExpenditure: 21500000,
    utilizationPercentage: 56.58,
    targetBeneficiaries: 4200,
    coveredBeneficiaries: 2950,
    remainingBeneficiaries: 1250,
    coveragePercentage: 70.24,
    projectsApproved: 4200,
    projectsStarted: 3800,
    projectsCompleted: 2400,
    projectsDelayed: 520,
    staffingSanctioned: 18,
    staffingWorking: 11,
    staffingVacancies: 7,
    complaintsReceived: 31,
    complaintsResolved: 20,
    complaintsPending: 11,
    challenges: "Severe lack of technical staff (Junior Engineers vacant). Project mapping stalled in most parts.",
    remarks: "Requested Commissioner Office for temporary deputation of 2 Assistant Engineers from Muzaffarpur.",
    status: "Rejected",
    createdBy: "Sheohar District Officer",
    createdAt: "2026-04-28T15:40:00Z"
  }
];

let notificationsCache = [
  {
    id: "notif-01",
    type: "Critical",
    message: "Housing projects in Sheohar are heavily delayed by high vacant staff positions (7 vacancies out of 18 vacant positions).",
    district: "Sheohar",
    schemeName: "PMAY-G",
    timestamp: "2026-05-01T08:00:00Z",
    read: false
  },
  {
    id: "notif-02",
    type: "Warning",
    message: "Jal Jeevan Mission utilization in Sitamarhi is below 70% of allocations. Accelerated intervention suggested.",
    district: "Sitamarhi",
    schemeName: "JJM",
    timestamp: "2026-05-01T09:30:00Z",
    read: false
  },
  {
    id: "notif-03",
    type: "Information",
    message: "Muzaffarpur successfully submitted full housing reports for April 2026 with a 93% utilization rate.",
    district: "Muzaffarpur",
    schemeName: "PMAY-G",
    timestamp: "2026-05-01T10:15:00Z",
    read: true
  }
];

let auditLogsCache = [
  {
    id: "log-01",
    username: "muzaffarpur_officer",
    action: "Data Submission",
    details: "April 2026 report for scheme PMAY-G submitted with allocation of 12.5 Cr and 93% utilization.",
    timestamp: "2026-04-28T14:32:00Z",
    ipAddress: "10.128.32.41"
  },
  {
    id: "log-02",
    username: "sitamarhi_officer",
    action: "Edit Draft",
    details: "Modified physical progress values on JJM April 2026 workspace.",
    timestamp: "2026-04-29T16:40:00Z",
    ipAddress: "10.128.33.12"
  },
  {
    id: "log-03",
    username: "commissioner_admin",
    action: "Approval Action",
    details: "Approved April 2026 submission for PMAY-G - Muzaffarpur.",
    timestamp: "2026-05-01T08:50:00Z",
    ipAddress: "10.128.1.100"
  }
];

// -----------------------------------------------------
// FULL-STACK CRUD API ROUTES
// -----------------------------------------------------

// Schemes Endpoints
app.get("/api/schemes", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("schemes").select("*");
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
      if (error) handleSupabaseError("schemes (read)", error);
    } catch (e: any) {
      handleSupabaseError("schemes (read Exception)", e);
    }
  }
  res.json(schemesCache);
});

app.post("/api/schemes", async (req, res) => {
  const newScheme = req.body;
  if (!newScheme.id) {
    return res.status(400).json({ error: "Scheme ID is required" });
  }

  // Add to in-memory fallback
  schemesCache = schemesCache.filter(s => s.id !== newScheme.id);
  schemesCache.push(newScheme);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("schemes").upsert(newScheme);
      if (error) handleSupabaseError("schemes (upsert)", error);
    } catch (e: any) {
      handleSupabaseError("schemes (upsert Exception)", e);
    }
  }

  res.json({ success: true, record: newScheme });
});

app.delete("/api/schemes/:id", async (req, res) => {
  const { id } = req.params;
  
  // Remove from in-memory fallback
  schemesCache = schemesCache.filter(s => s.id !== id);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("schemes").delete().eq("id", id);
      if (error) handleSupabaseError("schemes (delete)", error);
    } catch (e: any) {
      handleSupabaseError("schemes (delete Exception)", e);
    }
  }
  res.json({ success: true });
});

// Submissions Endpoints
app.get("/api/submissions", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("submissions").select("*");
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
      if (error) handleSupabaseError("submissions (read)", error);
    } catch (e: any) {
      handleSupabaseError("submissions (read Exception)", e);
    }
  }
  res.json(submissionsCache);
});

app.post("/api/submissions", async (req, res) => {
  const record = req.body;
  if (!record.id) {
    return res.status(400).json({ error: "Record ID is required" });
  }

  // Update in-memory fallback
  const idx = submissionsCache.findIndex(s => s.id === record.id);
  if (idx >= 0) {
    submissionsCache[idx] = record;
  } else {
    submissionsCache.unshift(record);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("submissions").upsert(record);
      if (error) handleSupabaseError("submissions (upsert)", error);
    } catch (e: any) {
      handleSupabaseError("submissions (upsert Exception)", e);
    }
  }

  res.json({ success: true, record });
});

app.delete("/api/submissions/:id", async (req, res) => {
  const { id } = req.params;
  submissionsCache = submissionsCache.filter(s => s.id !== id);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("submissions").delete().eq("id", id);
      if (error) handleSupabaseError("submissions (delete)", error);
    } catch (e: any) {
      handleSupabaseError("submissions (delete Exception)", e);
    }
  }

  res.json({ success: true });
});

// Notifications Endpoints
app.get("/api/notifications", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("notifications").select("*").order("timestamp", { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
      if (error) handleSupabaseError("notifications (read)", error);
    } catch (e: any) {
      handleSupabaseError("notifications (read Exception)", e);
    }
  }
  res.json(notificationsCache);
});

app.post("/api/notifications", async (req, res) => {
  const notification = req.body;
  notificationsCache.unshift(notification);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("notifications").insert(notification);
      if (error) handleSupabaseError("notifications (insert)", error);
    } catch (e: any) {
      handleSupabaseError("notifications (insert Exception)", e);
    }
  }
  res.json({ success: true });
});

app.post("/api/notifications/read-all", async (req, res) => {
  notificationsCache = notificationsCache.map(n => ({ ...n, read: true }));

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
      if (error) handleSupabaseError("notifications (update read-all)", error);
    } catch (e: any) {
      handleSupabaseError("notifications (update read-all Exception)", e);
    }
  }
  res.json({ success: true });
});

// Audit Logs Endpoints
app.get("/api/audit-logs", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("audit_logs").select("*").order("timestamp", { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
      if (error) handleSupabaseError("audit_logs (read)", error);
    } catch (e: any) {
      handleSupabaseError("audit_logs (read Exception)", e);
    }
  }
  res.json(auditLogsCache);
});

app.post("/api/audit-logs", async (req, res) => {
  const log = req.body;
  auditLogsCache.unshift(log);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("audit_logs").insert(log);
      if (error) handleSupabaseError("audit_logs (insert)", error);
    } catch (e: any) {
      handleSupabaseError("audit_logs (insert Exception)", e);
    }
  }
  res.json({ success: true });
});

// AI Brief Generator API Endpoint (Server-Side Only for API Key security)
app.post("/api/gemini/brief", async (req, res) => {
  try {
    const { district, month, year, dataRecords } = req.body;

    if (!district || !month || !year) {
      return res.status(400).json({ error: "Missing required parameters: district, month, year" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: "GEMINI_API_KEY is not defined in Settings > Secrets. Please go to AI Studio Settings > Secrets, add GEMINI_API_KEY, and then click the request button again." 
      });
    }

    const payloadText = JSON.stringify(dataRecords || [], null, 2);

    const prompt = `
      You are the Chief AI Advisor to the Divisional Commissioner of the Tirhut Division, Bihar, India.
      Generate an executive-level monthly scheme performance and warning brief for the Commissioner.
      
      Reporting Details:
      - Target District/Scope: ${district}
      - Period: ${month} ${year}
      
      Recent Scheme Progress Data:
      ${payloadText}
      
      Structure your response with elegant, highly clinical markdown. Avoid any flowery or marketing-style descriptions.
      Structure the output with:
      1. **EXECUTIVE OVERVIEW**: (Brief summary of Tirhut Division and the specific reporting scope, referencing key metrics).
      2. **OUTSTANDING PERFORMERS**: (Highlight schemes with high budget utilization >85% or excellent beneficiary coverage).
      3. **CRITICAL RED FLAGS & INTERVENTIONS**: (Identify schemes with utilization below 50%, high complaint counts, delayed milestones, or project stagnation).
      4. **COMMISSIONER DIRECTION**: (3 targeted, action-oriented policy recommendations tailored to the socio-economic context of Bihar, e.g. Jal Jeevan Mission, MGNREGA execution).
      
      Keep the brief informative, professional, authoritative, and direct.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const briefText = response.text || "Unable to compile summary. Please check user inputs and retry.";
    res.json({ result: briefText });
  } catch (error: any) {
    console.error("Gemini API Error in Server Dashboard:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI Advisor Brief" });
  }
});

// Start routing files
const startServer = async () => {
  // Vite Integration in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static assets serving.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TISMAP Server active on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Critical server failure on boot:", err);
});
