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

let submissionsCache: any[] = [];
let notificationsCache: any[] = [];
let auditLogsCache: any[] = [];

// -----------------------------------------------------
// FULL-STACK CRUD API ROUTES
// -----------------------------------------------------

// Schemes Endpoints
app.get("/api/schemes", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("schemes").select("*");
      if (!error && data) {
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
      if (!error && data) {
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
      if (!error && data) {
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
      if (!error && data) {
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
