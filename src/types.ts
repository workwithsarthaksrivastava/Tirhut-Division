export interface Scheme {
  id: string;
  name: string;
  code: string;
  department: string;
  category: "Rural Development" | "Health" | "Education" | "Infrastructure" | "Water & Sanitation" | "Social Welfare" | "Other";
  description: string;
  reportingFrequency: "Monthly" | "Quarterly" | "Yearly";
  customFields?: { name: string; type: "Number" | "Text" | "Percentage"; required: boolean }[];
}

export type SubmissionStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected";

export interface MonthlyProgress {
  id: string;
  district: string;
  schemeId: string;
  month: string;
  year: string;
  
  // Financial progress indicators
  totalAllocation: number;
  prevBalance: number;
  currentRelease: number;
  expenditureThisMonth: number;
  cumulativeExpenditure: number;
  utilizationPercentage: number;
  
  // Physical Progress Indicators
  targetBeneficiaries: number;
  coveredBeneficiaries: number;
  remainingBeneficiaries: number;
  coveragePercentage: number;
  
  // Project tracking indicators
  projectsApproved: number;
  projectsStarted: number;
  projectsCompleted: number;
  projectsDelayed: number;
  
  // HR metrics
  staffingSanctioned: number;
  staffingWorking: number;
  staffingVacancies: number;
  
  // Grievance metrics
  complaintsReceived: number;
  complaintsResolved: number;
  complaintsPending: number;
  
  // Qualitative fields
  challenges: string;
  remarks: string;
  attachmentName?: string;
  attachmentSize?: string;
  
  // Tracking
  status: SubmissionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  history?: { timestamp: string; status: SubmissionStatus; updatedBy: string; notes?: string }[];
}

export interface UserSession {
  district: string;
  role: "District Officer" | "Commissioner Office" | "Admin";
  isLoggedIn: boolean;
}

export interface AuditLog {
  id: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface SchemeNotification {
  id: string;
  type: "Critical" | "Warning" | "Information";
  message: string;
  district?: string;
  schemeName?: string;
  timestamp: string;
  read: boolean;
}

export const ALL_YEARS: string[] = Array.from({ length: 2150 - 1950 + 1 }, (_, i) => String(1950 + i));
export const ALL_MONTHS: string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

