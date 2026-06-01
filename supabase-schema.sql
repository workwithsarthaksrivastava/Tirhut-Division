-- Tirhut Division Integrated Scheme Monitoring Portal
-- Complete Supabase Schema Definition for Persistent Storage

-- 1. Create table for SCHEMES
CREATE TABLE IF NOT EXISTS schemes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department TEXT,
  category TEXT,
  description TEXT,
  "reportingFrequency" TEXT DEFAULT 'Monthly'
);

-- Enable Row Level Security (RLS) or add default policies (or bypass for quick client integration)
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for schemes" ON schemes FOR ALL USING (true) WITH CHECK (true);

-- 2. Create table for SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  district TEXT NOT NULL,
  "schemeId" TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  "totalAllocation" NUMERIC NOT NULL DEFAULT 0,
  "prevBalance" NUMERIC DEFAULT 0,
  "currentRelease" NUMERIC DEFAULT 0,
  "expenditureThisMonth" NUMERIC DEFAULT 0,
  "cumulativeExpenditure" NUMERIC DEFAULT 0,
  "utilizationPercentage" NUMERIC DEFAULT 0,
  "targetBeneficiaries" NUMERIC DEFAULT 0,
  "coveredBeneficiaries" NUMERIC DEFAULT 0,
  "remainingBeneficiaries" NUMERIC DEFAULT 0,
  "coveragePercentage" NUMERIC DEFAULT 0,
  "projectsApproved" NUMERIC DEFAULT 0,
  "projectsStarted" NUMERIC DEFAULT 0,
  "projectsCompleted" NUMERIC DEFAULT 0,
  "projectsDelayed" NUMERIC DEFAULT 0,
  "staffingSanctioned" NUMERIC DEFAULT 0,
  "staffingWorking" NUMERIC DEFAULT 0,
  "staffingVacancies" NUMERIC DEFAULT 0,
  "complaintsReceived" NUMERIC DEFAULT 0,
  "complaintsResolved" NUMERIC DEFAULT 0,
  "complaintsPending" NUMERIC DEFAULT 0,
  challenges TEXT,
  remarks TEXT,
  status TEXT DEFAULT 'Under Review',
  "createdBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);

-- 3. Create table for NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  district TEXT,
  "schemeName" TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- 4. Create table for AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  "ipAddress" TEXT
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Insert Default Schemes to boot
INSERT INTO schemes (id, name, code, department, category, description, "reportingFrequency")
VALUES
  ('pmayg', 'PMAY-G (Pradhan Mantri Awas Yojana - Gramin)', 'SCH-PMAYG', 'Rural Development Department', 'Rural Development', 'Providing quality housing with basic amenities to all homeless and households living in dilapidated houses in rural areas.', 'Monthly'),
  ('jjm', 'JJM (Jal Jeevan Mission - Har Ghar Nal Ka Jal)', 'SCH-JJM', 'Public Health Engineering Department', 'Water & Sanitation', 'Providing functional household tap connections (FHTC) to every rural household, ensuring safe and adequate drinking water.', 'Monthly'),
  ('mgnrega', 'MGNREGA (National Rural Employment Guarantee Scheme)', 'SCH-MGNREGA', 'Rural Development Department', 'Rural Development', 'Guaranteeing 100 days of wage employment per year to rural households to enhance livelihood security.', 'Monthly'),
  ('nhm', 'NHM (National Health Mission)', 'SCH-NHM', 'Health Department', 'Health', 'Providing universal access to equitable, affordable and quality health care services that are responsive to people''s needs.', 'Monthly'),
  ('samagra', 'Samagra Shiksha (Rural Education Upliftment)', 'SCH-SAMAGRA', 'Education Department', 'Education', 'Support scheme for schools aiming to provide inclusive, equitable, quality primary and secondary education.', 'Monthly'),
  ('icds', 'ICDS (Integrated Child Development Services)', 'SCH-ICDS', 'Social Welfare Department', 'Social Welfare', 'Providing food, preschool education, primary healthcare, immunization, and health checkups to infants and mothers.', 'Monthly')
ON CONFLICT (id) DO NOTHING;
