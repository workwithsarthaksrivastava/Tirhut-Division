import React, { useState, useEffect, useRef } from "react";
import { Scheme, MonthlyProgress, SubmissionStatus } from "../types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  FileText,
  Upload,
  Coins,
  Users,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Save,
  Clock,
  CheckSquare,
  Sparkles,
  Sheet,
} from "lucide-react";

interface SchemeFormProps {
  schemes: Scheme[];
  activeDistrict: string;
  allSubmissions: MonthlyProgress[];
  onSaveSubmission: (record: MonthlyProgress) => void;
  onDeleteSubmission: (id: string) => void;
  currentUser: string;
  isCommissionerOrAdmin: boolean;
  isDarkMode?: boolean;
}

type TabType = "finance" | "physical" | "projects" | "grievance" | "staffing";

export default function SchemeForm({
  schemes,
  activeDistrict,
  allSubmissions,
  onSaveSubmission,
  onDeleteSubmission,
  currentUser,
  isCommissionerOrAdmin,
  isDarkMode = false,
}: SchemeFormProps) {
  // District selector option if user is Commissioner/Admin (they can report for ANY district)
  const [reportDistrict, setReportDistrict] = useState<string>(activeDistrict);

  useEffect(() => {
    setReportDistrict(activeDistrict);
  }, [activeDistrict]);

  const TARGET_DISTRICTS = [
    "Muzaffarpur",
    "Sitamarhi",
    "Sheohar",
    "East Champaran",
    "West Champaran",
    "Vaishali",
  ];

  // Selected configurations
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(schemes[0]?.id || "");
  const [selectedMonth, setSelectedMonth] = useState<string>("April");
  const [selectedYear, setSelectedYear] = useState<string>("2026");

  // Form states divided by metric categories
  const [totalAllocation, setTotalAllocation] = useState<number>(10000000);
  const [prevBalance, setPrevBalance] = useState<number>(2000000);
  const [currentRelease, setCurrentRelease] = useState<number>(8000000);
  const [expenditureThisMonth, setExpenditureThisMonth] = useState<number>(1500000);
  const [cumulativeExpenditure, setCumulativeExpenditure] = useState<number>(3500000);

  const [targetBeneficiaries, setTargetBeneficiaries] = useState<number>(5000);
  const [coveredBeneficiaries, setCoveredBeneficiaries] = useState<number>(4100);

  const [projectsApproved, setProjectsApproved] = useState<number>(120);
  const [projectsStarted, setProjectsStarted] = useState<number>(110);
  const [projectsCompleted, setProjectsCompleted] = useState<number>(85);
  const [projectsDelayed, setProjectsDelayed] = useState<number>(5);

  const [complaintsReceived, setComplaintsReceived] = useState<number>(45);
  const [complaintsResolved, setComplaintsResolved] = useState<number>(38);

  const [staffingSanctioned, setStaffingSanctioned] = useState<number>(25);
  const [staffingWorking, setStaffingWorking] = useState<number>(21);

  const [challenges, setChallenges] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  // Status & edit tracking
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("finance");
  const [autosaveMsg, setAutosaveMsg] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [scrapedFile, setScrapedFile] = useState<{ name: string; size: string } | null>(null);

  // Modal display view
  const [viewingRecord, setViewingRecord] = useState<MonthlyProgress | null>(null);

  // Custom inline Modals to replace native confirm and prompt dialogues which are blocked in standard iframe preview sandbox environments
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "delete";
    record: MonthlyProgress;
    comment?: string;
  } | null>(null);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-calculated rates
  const utilizationPercentage = totalAllocation > 0 ? parseFloat(((cumulativeExpenditure / totalAllocation) * 100).toFixed(2)) : 0;
  const coveragePercentage = targetBeneficiaries > 0 ? parseFloat(((coveredBeneficiaries / targetBeneficiaries) * 100).toFixed(2)) : 0;
  const staffingVacancies = Math.max(0, staffingSanctioned - staffingWorking);
  const complaintsPending = Math.max(0, complaintsReceived - complaintsResolved);

  // Autofill mock metrics based on scheme selection to avoid tedious user typing in testing
  const triggerMetricsAutofill = (schemeId: string) => {
    if (schemeId === "pmayg") {
      setTotalAllocation(110000000);
      setPrevBalance(20000000);
      setCurrentRelease(90000000);
      setExpenditureThisMonth(32000000);
      setCumulativeExpenditure(88000000);
      setTargetBeneficiaries(12000);
      setCoveredBeneficiaries(9600);
      setProjectsApproved(12000);
      setProjectsStarted(11500);
      setProjectsCompleted(9200);
      setProjectsDelayed(250);
      setComplaintsReceived(40);
      setComplaintsResolved(32);
      setStaffingSanctioned(30);
      setStaffingWorking(26);
      setChallenges("Logistical delays in sourcing premium structural bricks. Short labor cycle due to local festivals.");
      setRemarks("On target. Physical reviews finalized. Block supervisors deployed for direct audit checks.");
    } else if (schemeId === "jjm") {
      setTotalAllocation(135000000);
      setPrevBalance(30000000);
      setCurrentRelease(105000000);
      setExpenditureThisMonth(45000000);
      setCumulativeExpenditure(98000000);
      setTargetBeneficiaries(32000);
      setCoveredBeneficiaries(25400);
      setProjectsApproved(180);
      setProjectsStarted(170);
      setProjectsCompleted(120);
      setProjectsDelayed(12);
      setComplaintsReceived(80);
      setComplaintsResolved(64);
      setStaffingSanctioned(24);
      setStaffingWorking(19);
      setChallenges("Heavy geological sand variations found in northern sectors causing drilling rig setbacks.");
      setRemarks("Additional deep-bore rigs mobilized from central sectors. Progress will align by mid-month.");
    } else {
      // Default standard average
      setTotalAllocation(60000000);
      setPrevBalance(10000000);
      setCurrentRelease(50000000);
      setExpenditureThisMonth(12000000);
      setCumulativeExpenditure(42000000);
      setTargetBeneficiaries(8000);
      setCoveredBeneficiaries(7100);
      setProjectsApproved(40);
      setProjectsStarted(38);
      setProjectsCompleted(30);
      setProjectsDelayed(3);
      setComplaintsReceived(20);
      setComplaintsResolved(18);
      setStaffingSanctioned(15);
      setStaffingWorking(14);
      setChallenges("");
      setRemarks("");
    }
  };

  useEffect(() => {
    if (!editingId) {
      triggerMetricsAutofill(selectedSchemeId);
    }
  }, [selectedSchemeId, editingId]);

  // Simulate background autosave on field transitions
  const triggerAutosave = () => {
    setAutosaveMsg("Draft saving...");
    setTimeout(() => {
      setAutosaveMsg("Draft saved. Local cache synced.");
      setTimeout(() => setAutosaveMsg(""), 3000);
    }, 8000);
  };

  // Manage Excel file drop bulk uploader simulation
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus("Uploading Excel blueprint...");
      setTimeout(() => {
        setUploadStatus("Validating schema columns...");
        setTimeout(() => {
          setUploadStatus("");
          setScrapedFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
          // Populate form with random excellent indicator values
          setTotalAllocation(145000000);
          setPrevBalance(15000000);
          setCurrentRelease(130000000);
          setExpenditureThisMonth(68000000);
          setCumulativeExpenditure(128000000);
          setTargetBeneficiaries(18200);
          setCoveredBeneficiaries(17100);
          setChallenges("No active challenges detected. Automated bulk Excel sheet alignment successful.");
          setRemarks(`Imported values successfully from Excel resource: ${file.name}`);
        }, 1200);
      }, 1000);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScrapedFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
    }
  };

  // Reset form metrics
  const handleReset = () => {
    setEditingId(null);
    triggerMetricsAutofill(selectedSchemeId);
    setScrapedFile(null);
  };

  // Handles submission
  const handleSubmit = (status: SubmissionStatus) => {
    const errors: string[] = [];

    // 1. Finance Checks
    if (totalAllocation < 0) errors.push("Total Program Allocation cannot be negative.");
    if (prevBalance < 0) errors.push("Previous Opening Balance cannot be negative.");
    if (currentRelease < 0) errors.push("Current Month Release cannot be negative.");
    if (expenditureThisMonth < 0) errors.push("Expenditure This Month cannot be negative.");
    if (cumulativeExpenditure < 0) errors.push("Cumulative Expenditure cannot be negative.");
    
    if (cumulativeExpenditure > totalAllocation) {
      errors.push(`Cumulative Expenditure (₹${cumulativeExpenditure.toLocaleString()}) cannot exceed the program's Total Allocation (₹${totalAllocation.toLocaleString()}).`);
    }
    if (expenditureThisMonth > cumulativeExpenditure) {
      errors.push(`Expenditure This Month (₹${expenditureThisMonth.toLocaleString()}) cannot exceed Cumulative Expenditure (₹${cumulativeExpenditure.toLocaleString()}).`);
    }
    if (prevBalance + currentRelease > totalAllocation) {
      errors.push(`Sum of Opening Balance (₹${prevBalance.toLocaleString()}) and Current Month Release (₹${currentRelease.toLocaleString()}) cannot exceed Total Allocation (₹${totalAllocation.toLocaleString()}).`);
    }

    // 2. Physical Target Checks
    if (targetBeneficiaries < 0) errors.push("Target Beneficiaries count cannot be negative.");
    if (coveredBeneficiaries < 0) errors.push("Covered Beneficiaries count cannot be negative.");
    if (coveredBeneficiaries > targetBeneficiaries) {
      errors.push(`Covered beneficiaries (${coveredBeneficiaries.toLocaleString()}) exceeds target demographic count (${targetBeneficiaries.toLocaleString()}).`);
    }

    // 3. Project Status Checks
    if (projectsApproved < 0) errors.push("Approved Projects must be non-negative.");
    if (projectsStarted < 0) errors.push("Started Projects must be non-negative.");
    if (projectsCompleted < 0) errors.push("Completed Projects must be non-negative.");
    if (projectsDelayed < 0) errors.push("Delayed Projects must be non-negative.");
    
    if (projectsStarted > projectsApproved) {
      errors.push(`Started Projects (${projectsStarted}) cannot exceed Approved Projects (${projectsApproved}).`);
    }
    if (projectsCompleted > projectsStarted) {
      errors.push(`Completed Projects (${projectsCompleted}) cannot exceed Started Projects (${projectsStarted}).`);
    }
    if (projectsCompleted + projectsDelayed > projectsApproved) {
      errors.push(`Sum of Completed and Delayed projects (${projectsCompleted + projectsDelayed}) exceeds Approved Projects (${projectsApproved}).`);
    }

    // 4. Staffing Checks
    if (staffingSanctioned < 0) errors.push("Sanctioned posts must be non-negative.");
    if (staffingWorking < 0) errors.push("Working personnel must be non-negative.");
    if (staffingWorking > staffingSanctioned) {
      errors.push(`Working personnel count (${staffingWorking}) exceeds approved Sanctioned Posts (${staffingSanctioned}).`);
    }

    // 5. Grievance Checks
    if (complaintsReceived < 0) errors.push("Received complaints must be non-negative.");
    if (complaintsResolved < 0) errors.push("Resolved complaints must be non-negative.");
    if (complaintsResolved > complaintsReceived) {
      errors.push(`Resolved complaints (${complaintsResolved}) exceeds period complaints received (${complaintsReceived}).`);
    }

    // 6. Descriptive Checks for Submitted Status
    if (status === "Submitted") {
      if (projectsDelayed > 0 && (!challenges || challenges.trim().length < 8)) {
        errors.push("Missing challenge justification: Please specify details explaining roadblocks (at least 8 characters) if there are active delayed projects.");
      }
      if (complaintsPending > 0 && (!remarks || remarks.trim().length < 5)) {
        errors.push("Missing comments: Please specify remarks addressing how pending grievances will be tracked/resolved.");
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      const hostContainer = document.getElementById("validation-alerts-container");
      if (hostContainer) {
        hostContainer.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return; // halt save/submission
    }

    setValidationErrors([]); // Clear validation errors on correct save

    const newRecord: MonthlyProgress = {
      id: editingId || `sub-${Date.now()}`,
      district: isCommissionerOrAdmin ? reportDistrict : activeDistrict,
      schemeId: selectedSchemeId,
      month: selectedMonth,
      year: selectedYear,
      totalAllocation,
      prevBalance,
      currentRelease,
      expenditureThisMonth,
      cumulativeExpenditure,
      utilizationPercentage,
      targetBeneficiaries,
      coveredBeneficiaries,
      remainingBeneficiaries: Math.max(0, targetBeneficiaries - coveredBeneficiaries),
      coveragePercentage,
      projectsApproved,
      projectsStarted,
      projectsCompleted,
      projectsDelayed,
      staffingSanctioned,
      staffingWorking,
      staffingVacancies,
      complaintsReceived,
      complaintsResolved,
      complaintsPending,
      challenges,
      remarks,
      attachmentName: scrapedFile?.name || "None uploaded",
      attachmentSize: scrapedFile?.size || undefined,
      status,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };

    onSaveSubmission(newRecord);
    handleReset();
  };

  // Load record values into editor
  const handleEditInitiation = (record: MonthlyProgress) => {
    setEditingId(record.id);
    setSelectedSchemeId(record.schemeId);
    setSelectedMonth(record.month);
    setSelectedYear(record.year);
    setReportDistrict(record.district);

    setTotalAllocation(record.totalAllocation);
    setPrevBalance(record.prevBalance);
    setCurrentRelease(record.currentRelease);
    setExpenditureThisMonth(record.expenditureThisMonth);
    setCumulativeExpenditure(record.cumulativeExpenditure);

    setTargetBeneficiaries(record.targetBeneficiaries);
    setCoveredBeneficiaries(record.coveredBeneficiaries);

    setProjectsApproved(record.projectsApproved);
    setProjectsStarted(record.projectsStarted);
    setProjectsCompleted(record.projectsCompleted);
    setProjectsDelayed(record.projectsDelayed);

    setComplaintsReceived(record.complaintsReceived);
    setComplaintsResolved(record.complaintsResolved);

    setStaffingSanctioned(record.staffingSanctioned);
    setStaffingWorking(record.staffingWorking);

    setChallenges(record.challenges);
    setRemarks(record.remarks);

    if (record.attachmentName && record.attachmentName !== "None uploaded") {
      setScrapedFile({ name: record.attachmentName, size: record.attachmentSize || "Size unknown" });
    } else {
      setScrapedFile(null);
    }

    setActiveTab("finance");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // Filter records to review in table for reporting authority
  const recordList = allSubmissions.filter((s) => {
    if (isCommissionerOrAdmin) {
      if (reportDistrict === "All Tirhut Division") return true;
      return s.district === reportDistrict;
    }
    return s.district === activeDistrict;
  });

  // PDF Export States & Handlers
  const [isExporting, setIsExporting] = useState(false);

  // Compute aggregated values for report charts
  const totalAlloc = recordList.reduce((acc, r) => acc + r.totalAllocation, 0);
  const totalExp = recordList.reduce((acc, r) => acc + r.cumulativeExpenditure, 0);
  const totalTargetBen = recordList.reduce((acc, r) => acc + r.targetBeneficiaries, 0);
  const totalCoveredBen = recordList.reduce((acc, r) => acc + r.coveredBeneficiaries, 0);
  const avgUtil = totalAlloc > 0 ? parseFloat(((totalExp / totalAlloc) * 100).toFixed(2)) : 0;
  const avgCoverage = totalTargetBen > 0 ? parseFloat(((totalCoveredBen / totalTargetBen) * 100).toFixed(2)) : 0;

  // Concentric circle variables
  const strokeDashVal = (avgCoverage / 100) * 314;
  const strokeRemainingVal = 314 - strokeDashVal;

  const handleExportPDF = async () => {
    setIsExporting(true);

    // 1. Intercept getComputedStyle to bypass any oklch colors returned by browser
    const origGetComputedStyle = window.getComputedStyle;
    const customGetComputedStyle = function(el: Element, pseudo?: string | null) {
      const style = origGetComputedStyle(el, pseudo);
      return new Proxy(style, {
        get(target, prop) {
          const val = target[prop as any];
          if (typeof val === 'string' && val.includes('oklch')) {
            // Replace with a default fallback Slate color (e.g., rgba(100,116,139,1))
            // This prevents html2canvas from failing on parsed oklch values
            return 'rgba(100, 116, 139, 1)';
          }
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const originalVal = target.getPropertyValue(propertyName);
              if (typeof originalVal === 'string' && originalVal.includes('oklch')) {
                return 'rgba(100, 116, 139, 1)';
              }
              return originalVal;
            };
          }
          if (typeof val === 'function') {
            return (val as any).bind(target);
          }
          return val;
        }
      }) as any;
    };

    window.getComputedStyle = customGetComputedStyle;
    if (document.defaultView) {
      document.defaultView.getComputedStyle = customGetComputedStyle;
    }

    // 2. Intercept CSSStyleSheet rules to completely filter out rules containing "oklch" which crashes html2canvas
    const targetProto = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "cssRules") ? CSSStyleSheet.prototype : StyleSheet.prototype;

    let cssRulesDesc = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "cssRules") || 
                       Object.getOwnPropertyDescriptor(StyleSheet.prototype, "cssRules");
    let rulesDesc = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "rules") || 
                    Object.getOwnPropertyDescriptor(StyleSheet.prototype, "rules");

    const origCssRules = cssRulesDesc?.get;
    const origRules = rulesDesc?.get;

    if (origCssRules) {
      Object.defineProperty(targetProto, "cssRules", {
        get() {
          try {
            const rulesList = origCssRules.call(this);
            if (!rulesList) return rulesList;
            const filtered: any[] = [];
            for (let i = 0; i < rulesList.length; i++) {
              try {
                const r = rulesList[i];
                if (r && r.cssText && r.cssText.includes("oklch")) {
                  continue;
                }
                filtered.push(r);
              } catch {
                // Fallback for cross-origin sheets that throw security errors
                if (rulesList[i]) filtered.push(rulesList[i]);
              }
            }
            const proxyList: any = {
              length: filtered.length,
              item(idx: number) { return filtered[idx] || null; }
            };
            for (let i = 0; i < filtered.length; i++) {
              proxyList[i] = filtered[i];
            }
            return proxyList;
          } catch {
            return [];
          }
        },
        configurable: true
      });
    }

    if (origRules) {
      Object.defineProperty(targetProto, "rules", {
        get() {
          try {
            const rulesList = origRules.call(this);
            if (!rulesList) return rulesList;
            const filtered: any[] = [];
            for (let i = 0; i < rulesList.length; i++) {
              try {
                const r = rulesList[i];
                if (r && r.cssText && r.cssText.includes("oklch")) {
                  continue;
                }
                filtered.push(r);
              } catch {
                if (rulesList[i]) filtered.push(rulesList[i]);
              }
            }
            const proxyList: any = {
              length: filtered.length,
              item(idx: number) { return filtered[idx] || null; }
            };
            for (let i = 0; i < filtered.length; i++) {
              proxyList[i] = filtered[i];
            }
            return proxyList;
          } catch {
            return [];
          }
        },
        configurable: true
      });
    }

    const restoreGlobals = () => {
      // Restore getComputedStyle
      window.getComputedStyle = origGetComputedStyle;
      if (document.defaultView) {
        document.defaultView.getComputedStyle = origGetComputedStyle;
      }
      // Restore stylesheet descriptors
      if (cssRulesDesc) {
        Object.defineProperty(targetProto, "cssRules", cssRulesDesc);
      }
      if (rulesDesc) {
        Object.defineProperty(targetProto, "rules", rulesDesc);
      }
    };

    setTimeout(async () => {
      try {
        const element = document.getElementById("pdf-report-template");
        if (!element) {
          alert("Error: Report template element was not found.");
          restoreGlobals();
          setIsExporting(false);
          return;
        }

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        // Restore immediately after canvas acquisition
        restoreGlobals();

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 210; 
        const pageHeight = 297; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
          heightLeft -= pageHeight;
        }

        const safeFilename = `Tirhut_OSMS_Report_${reportDistrict.replace(/ /g, "_")}_${selectedMonth}_${selectedYear}.pdf`;
        pdf.save(safeFilename);
      } catch (error) {
        console.error("PDF generation failure:", error);
      } finally {
        restoreGlobals();
        setIsExporting(false);
      }
    }, 300);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Selector Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-lg text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Progress Workspace Panel</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Fill and maintain official scheme progress returns for target division districts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            {isCommissionerOrAdmin && (
              <div className="flex flex-col">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-0.5 px-1">District Focus</span>
                <select
                  value={reportDistrict}
                  onChange={(e) => {
                    setReportDistrict(e.target.value);
                    triggerAutosave();
                  }}
                  className="bg-transparent text-xs text-slate-200 outline-none border-r border-slate-800 pr-3 font-semibold pointer-events-auto"
                >
                  <option value="All Tirhut Division">All Division Units</option>
                  {TARGET_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} Unit
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col pl-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-0.5 px-1">Active Scheme</span>
              <select
                value={selectedSchemeId}
                onChange={(e) => setSelectedSchemeId(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none pr-3"
              >
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col border-l border-slate-800 pl-3">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-0.5 px-1 font-semibold">Reporting Month/Year</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-200">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  {["January", "February", "March", "April", "May", "June"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="text-slate-600">/</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Bulk excel import helper ribbon */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sheet className="w-4 h-4 text-emerald-400" />
            <span>Have an existing Excel spreadsheet? Import directly:</span>
          </div>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              id="bulk-excel"
              onChange={handleExcelUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
            <label
              htmlFor="bulk-excel"
              className="bg-slate-800 hover:bg-slate-700/80 cursor-pointer text-[10px] font-mono uppercase tracking-widest px-4 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-emerald-400 inline-block"
            >
              {uploadStatus || "Upload Excel (.xlsx)"}
            </label>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="grid grid-cols-5 border-b border-slate-800 text-center">
          {(["finance", "physical", "projects", "grievance", "staffing"] as const).map((t) => {
            const isActive = activeTab === t;
            const labels: Record<TabType, { name: string; icon: any }> = {
              finance: { name: "Finance Progress", icon: Coins },
              physical: { name: "Physical Targets", icon: Users },
              projects: { name: "Projects Track", icon: Briefcase },
              grievance: { name: "Grievances", icon: AlertCircle },
              staffing: { name: "HR & Remarks", icon: FileText },
            };
            const Icon = labels[t].icon;

            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`py-3.5 px-1 sm:px-3 text-[10px] sm:text-xs font-sans font-medium transition-all border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "border-amber-500 text-amber-500 bg-slate-950/60 font-semibold"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-950/20"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-500" : "text-slate-500"}`} />
                <span className="hidden md:inline">{labels[t].name}</span>
                <span className="md:hidden">{labels[t].name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="p-6 md:p-8 space-y-6">
          {validationErrors.length > 0 && (
            <div id="validation-alerts-container" className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-4 animate-fade-in text-rose-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-bold font-sans tracking-wide">Data Ledger Verification Discrepancies ({validationErrors.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationErrors([])}
                  className="text-[10px] font-mono text-rose-300 hover:text-rose-200 transition-colors uppercase cursor-pointer"
                >
                  Dismiss Warnings
                </button>
              </div>
              <ul className="text-[11px] list-disc list-inside space-y-1 font-mono leading-relaxed pl-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="text-rose-300/80">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "finance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Total Program Allocation (₹)</label>
                <input
                  type="number"
                  value={totalAllocation}
                  onChange={(e) => {
                    setTotalAllocation(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Previous Opening Balance (₹)</label>
                <input
                  type="number"
                  value={prevBalance}
                  onChange={(e) => {
                    setPrevBalance(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Current Month Release (₹)</label>
                <input
                  type="number"
                  value={currentRelease}
                  onChange={(e) => {
                    setCurrentRelease(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Expenditure Incurred This Month (₹)</label>
                <input
                  type="number"
                  value={expenditureThisMonth}
                  onChange={(e) => {
                    setExpenditureThisMonth(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Cumulative Expenditure (₹)</label>
                <input
                  type="number"
                  value={cumulativeExpenditure}
                  onChange={(e) => {
                    setCumulativeExpenditure(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Readonly Derived Utilization Percent Indicator */}
              <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Fund Utilization Rate</span>
                <span className="text-xl font-mono text-amber-500 font-bold mt-1">
                  {utilizationPercentage}%
                </span>
                <span className="text-[9px] font-mono text-slate-400">Auto-calculated from allocation</span>
              </div>
            </div>
          )}

          {activeTab === "physical" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Target Beneficiaries (Count)</label>
                <input
                  type="number"
                  value={targetBeneficiaries}
                  onChange={(e) => {
                    setTargetBeneficiaries(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Covered Beneficiaries (Actual)</label>
                <input
                  type="number"
                  value={coveredBeneficiaries}
                  onChange={(e) => {
                    setCoveredBeneficiaries(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Target Coverage Progress</span>
                <span className="text-xl font-mono text-emerald-400 font-bold mt-1">
                  {coveragePercentage}%
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Remaining Gap: {(targetBeneficiaries - coveredBeneficiaries).toLocaleString()} families
                </span>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Total Approved Projects</label>
                <input
                  type="number"
                  value={projectsApproved}
                  onChange={(e) => {
                    setProjectsApproved(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Projects Commissioned/Started</label>
                <input
                  type="number"
                  value={projectsStarted}
                  onChange={(e) => {
                    setProjectsStarted(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Projects Fully Completed</label>
                <input
                  type="number"
                  value={projectsCompleted}
                  onChange={(e) => {
                    setProjectsCompleted(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Delayed Milestones</label>
                <input
                  type="number"
                  value={projectsDelayed}
                  onChange={(e) => {
                    setProjectsDelayed(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          )}

          {activeTab === "grievance" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Complaints / Grievances Received</label>
                <input
                  type="number"
                  value={complaintsReceived}
                  onChange={(e) => {
                    setComplaintsReceived(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400">Complaints Resolved Successfully</label>
                <input
                  type="number"
                  value={complaintsResolved}
                  onChange={(e) => {
                    setComplaintsResolved(Number(e.target.value));
                    triggerAutosave();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Unassigned Backlog</span>
                <span className="text-xl font-mono text-rose-500 font-bold mt-1">
                  {complaintsPending} Active
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Rate: {complaintsReceived > 0 ? ((complaintsResolved / complaintsReceived) * 100).toFixed(0) : 100}% cleared
                </span>
              </div>
            </div>
          )}

          {activeTab === "staffing" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-slate-400">Sanctioned Staff Strength</label>
                  <input
                    type="number"
                    value={staffingSanctioned}
                    onChange={(e) => {
                      setStaffingSanctioned(Number(e.target.value));
                      triggerAutosave();
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-slate-400">Active Working Staff count</label>
                  <input
                    type="number"
                    value={staffingWorking}
                    onChange={(e) => {
                      setStaffingWorking(Number(e.target.value));
                      triggerAutosave();
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Readonly vacancies */}
                <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Active Technical Vacancies</span>
                  <span className="text-xl font-mono text-amber-500 font-bold mt-1">
                    {staffingVacancies} open posts
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Occupancy: {staffingSanctioned > 0 ? ((staffingWorking / staffingSanctioned) * 100).toFixed(0) : 100}%
                  </span>
                </div>
              </div>

              {/* Qualitative Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-slate-400">Key Field Level Challenges / Bottlenecks</label>
                  <textarea
                    rows={3}
                    value={challenges}
                    onChange={(e) => {
                      setChallenges(e.target.value);
                      triggerAutosave();
                    }}
                    placeholder="E.g. Material supply chain delays, acquisition barriers, geographical water level challenges..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-slate-400">Special Administrative Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => {
                      setRemarks(e.target.value);
                      triggerAutosave();
                    }}
                    placeholder="E.g. Corrective steps taken, target realignment, request for additional resources..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* File Attachment Dropzone and Preview */}
              <div className="border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/20 text-center relative flex flex-col items-center justify-center">
                <input
                  type="file"
                  id="doc-upload"
                  onChange={handleDocumentUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                
                <Upload className="w-8 h-8 text-slate-600 mb-2 pointer-events-none" />
                <h4 className="font-sans font-medium text-xs text-slate-300 pointer-events-none">
                  Drag and Drop Supporting Document here, or <span className="text-amber-500">browse folders</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1 pointer-events-none">
                  Supports PDF or Excel sheets (Maximum limit: 25MB)
                </p>

                {scrapedFile && (
                  <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-left flex items-center justify-between min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs text-slate-200 font-sans font-medium truncate max-w-[180px]">{scrapedFile.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{scrapedFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScrapedFile(null)}
                      className="text-xs text-rose-500 font-bold px-2 py-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Action Controls Section inside Content */}
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500 font-mono">
              {autosaveMsg ? (
                <span className="text-emerald-400 font-medium tracking-wide flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> {autosaveMsg}
                </span>
              ) : (
                "Automatic recovery draft active in the background."
              )}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer"
              >
                Reset Fields
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("Draft")}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("Submitted")}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-sans font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(217,119,6,0.2)] flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Submit Work</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted Records Table below */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-sans font-semibold text-slate-100 text-sm">
              Records Management Registry: {reportDistrict}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Full audit log of active month returns. Review status, download reports, or edit responses instantly.
            </p>
          </div>
          {recordList.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-slate-900 hover:scale-[1.02] transform transition-all font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer font-extrabold border border-emerald-500/35 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
            >
              {isExporting ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin text-slate-900" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-slate-900" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
          )}
        </div>

        {recordList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3">Scheme</th>
                  <th className="py-3 px-3">Month</th>
                  <th className="py-3 px-3">Rate</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recordList.map((record) => {
                  const targetScheme = schemes.find((sc) => sc.id === record.schemeId);
                  
                  // Stylize status badging
                  const badgeColor =
                    record.status === "Approved"
                      ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/40"
                      : record.status === "Under Review"
                      ? "text-amber-400 bg-amber-950/60 border-amber-800/40"
                      : record.status === "Rejected"
                      ? "text-rose-400 bg-rose-950/60 border-rose-800/40"
                      : "text-slate-400 bg-slate-950 border-slate-800";

                  return (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-200">{record.district}</td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="text-xs font-semibold">{targetScheme?.name.split(" ")[0]}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{targetScheme?.code}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{record.month} {record.year}</td>
                      <td className="py-3 px-3 font-mono text-amber-500 font-medium">
                        {record.utilizationPercentage}%
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {record.coveragePercentage}%
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRecord(record)}
                            title="View Metrics Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEditInitiation(record)}
                            title="Edit Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {isCommissionerOrAdmin && (
                            <>
                              {record.status !== "Approved" && (
                                <button
                                  onClick={() => setConfirmAction({ type: "approve", record })}
                                  title="Approve Submission"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                >
                                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                                </button>
                              )}
                              {record.status !== "Rejected" && record.status !== "Approved" && (
                                <button
                                  onClick={() => setConfirmAction({ type: "reject", record, comment: "" })}
                                  title="Reject Submission"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                >
                                  <AlertCircle className="w-4 h-4 text-rose-500" />
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => setConfirmAction({ type: "delete", record })}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-500 font-sans italic">
              No reports active for {reportDistrict} in {selectedMonth} {selectedYear}. Use workspace above to add.
            </p>
          </div>
        )}
      </div>

      {/* Floating Eye Modal Dialogue Details */}
      {viewingRecord && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
          isDarkMode ? "bg-black/85" : "bg-cultural-dark/50"
        }`}>
          <div className={`rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto relative animate-scale-up border-2 ${
            isDarkMode 
              ? "bg-cultural-card-dark border-saffron text-ivory-cream" 
              : "bg-white border-saffron text-cultural-dark"
          }`}>
            <div className={`flex justify-between items-start pb-4 border-b ${
              isDarkMode ? "border-saffron/20" : "border-saffron/30"
            }`}>
              <div className="space-y-0.5">
                <span className={`text-[9px] font-mono uppercase tracking-widest font-bold block ${
                  isDarkMode ? "text-marigold-gold" : "text-saffron"
                }`}>
                  Official Progress Return
                </span>
                <h4 className="font-serif font-bold text-lg leading-tight">
                  {schemes.find((sc) => sc.id === viewingRecord.schemeId)?.name}
                </h4>
                <p className={`text-xs font-mono font-medium ${
                  isDarkMode ? "text-ivory-cream/70" : "text-cultural-dark/70"
                }`}>
                  District: {viewingRecord.district} | Period: {viewingRecord.month} {viewingRecord.year}
                </p>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className={`text-lg p-2 font-bold cursor-pointer hover:scale-110 transition-transform ${
                  isDarkMode ? "text-ivory-cream/80 hover:text-white" : "text-cultural-dark/80 hover:text-black"
                }`}
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`p-3 rounded-2xl border ${
                isDarkMode 
                  ? "bg-cultural-darker/60 border-saffron/20" 
                  : "bg-ivory-cream/40 border-saffron/20"
              }`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                  isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                }`}>Total Budget Allocation</span>
                <span className="text-sm font-bold font-mono block mt-1">₹{viewingRecord.totalAllocation.toLocaleString()}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isDarkMode 
                  ? "bg-cultural-darker/60 border-saffron/20" 
                  : "bg-ivory-cream/40 border-saffron/20"
              }`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                  isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                }`}>Cumulative Expenditure</span>
                <span className="text-sm font-bold font-mono block mt-1">₹{viewingRecord.cumulativeExpenditure.toLocaleString()}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isDarkMode 
                  ? "bg-cultural-darker/60 border-saffron/20" 
                  : "bg-ivory-cream/40 border-saffron/20"
              }`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                  isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                }`}>Utilization Percentage</span>
                <span className="text-sm font-bold text-marigold-gold font-mono block mt-1">{viewingRecord.utilizationPercentage}%</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isDarkMode 
                  ? "bg-cultural-darker/60 border-saffron/20" 
                  : "bg-ivory-cream/40 border-saffron/20"
              }`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                  isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                }`}>Target Beneficiaries</span>
                <span className="text-sm font-bold font-mono block mt-1">{viewingRecord.targetBeneficiaries.toLocaleString()}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isDarkMode 
                  ? "bg-cultural-darker/60 border-saffron/20" 
                  : "bg-ivory-cream/40 border-saffron/20"
              }`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                  isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                }`}>Covered Beneficiaries</span>
                <span className="text-sm font-bold font-mono block mt-1">{viewingRecord.coveredBeneficiaries.toLocaleString()}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isDarkMode 
                  ? "bg-cultural-darker/60 border-saffron/20" 
                  : "bg-ivory-cream/40 border-saffron/20"
              }`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                  isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                }`}>Coverage Ratio</span>
                <span className={`text-sm font-bold font-mono block mt-1 ${
                  isDarkMode ? "text-[#48BB78]" : "text-[#2F855A]"
                }`}>{viewingRecord.coveragePercentage}%</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                isDarkMode 
                  ? "bg-cultural-darker/40 border-saffron/15" 
                  : "bg-ivory-cream/20 border-saffron/15"
              }`}>
                <h5 className={`font-mono text-[9px] uppercase tracking-widest font-bold mb-2 ${
                  isDarkMode ? "text-marigold-gold" : "text-saffron"
                }`}>Projects & HR Tracking Metrics</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className={isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"}>Projects Ongoing:</span>
                    <span className="font-mono font-bold block">{viewingRecord.projectsStarted}</span>
                  </div>
                  <div>
                    <span className={isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"}>Projects Complete:</span>
                    <span className="font-mono font-bold block">{viewingRecord.projectsCompleted}</span>
                  </div>
                  <div>
                    <span className={isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"}>Grievance Pending:</span>
                    <span className="font-mono font-bold text-rose-500 block">{viewingRecord.complaintsPending}</span>
                  </div>
                  <div>
                    <span className={isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"}>Staff Vacancies:</span>
                    <span className="font-mono font-semibold text-marigold-gold block">{viewingRecord.staffingVacancies}</span>
                  </div>
                </div>
              </div>

              {viewingRecord.challenges && (
                <div className="space-y-1">
                  <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                    isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                  }`}>Identified Obstacles / Challenges:</span>
                  <p className={`border rounded-2xl p-3.5 text-xs font-sans leading-relaxed ${
                    isDarkMode 
                      ? "bg-cultural-darker border-saffron/20 text-ivory-cream/90" 
                      : "bg-white border-saffron/20 text-cultural-dark/90 shadow-inner"
                  }`}>
                    {viewingRecord.challenges}
                  </p>
                </div>
              )}

              {viewingRecord.remarks && (
                <div className="space-y-1">
                  <span className={`text-[9px] font-mono uppercase tracking-widest block font-medium ${
                    isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"
                  }`}>Special Recommendations / Remarks:</span>
                  <p className={`border rounded-2xl p-3.5 text-xs font-sans leading-relaxed ${
                    isDarkMode 
                      ? "bg-cultural-darker border-saffron/20 text-ivory-cream/90" 
                      : "bg-white border-saffron/20 text-cultural-dark/90 shadow-inner"
                  }`}>
                    {viewingRecord.remarks}
                  </p>
                </div>
              )}
            </div>

            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t ${
              isDarkMode ? "border-saffron/25" : "border-saffron/25"
            }`}>
              <div className="flex flex-col text-[10px] font-mono">
                <span className={isDarkMode ? "text-ivory-cream/50" : "text-cultural-dark/50"}>
                  Submitted by: {viewingRecord.createdBy}
                </span>
                <span className={`font-semibold mt-0.5 ${
                  viewingRecord.status === "Approved" ? "text-emerald-500" :
                  viewingRecord.status === "Rejected" ? "text-rose-500" :
                  viewingRecord.status === "Under Review" ? "text-amber-500" :
                  "text-slate-400"
                }`}>
                  Current Status: {viewingRecord.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isCommissionerOrAdmin && viewingRecord.status !== "Approved" && (
                  <button
                    onClick={() => {
                      setConfirmAction({ type: "approve", record: viewingRecord });
                      setViewingRecord(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}
                {isCommissionerOrAdmin && viewingRecord.status !== "Rejected" && viewingRecord.status !== "Approved" && (
                  <button
                    onClick={() => {
                      setConfirmAction({ type: "reject", record: viewingRecord, comment: "" });
                      setViewingRecord(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-sans font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingRecord(null)}
                  className="bg-saffron font-sans hover:bg-saffron-dark text-white font-bold uppercase tracking-wider py-2 px-5 rounded-xl transition-all cursor-pointer shadow-md text-[10px]"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF template for high-fidelity administrative export */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div 
          id="pdf-report-template" 
          className="w-[842px] p-10 font-sans flex flex-col justify-between" 
          style={{ boxSizing: "border-box", minHeight: "1191px", backgroundColor: "#ffffff", color: "#1e293b", fontFamily: "sans-serif" }}
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4" style={{ borderBottom: "4px solid #d97706" }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: "#d97706" }} />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest" style={{ color: "#b45309" }}>
                    Bihar Divisional Monitoring Services
                  </span>
                </div>
                <h1 className="font-serif font-black text-2xl tracking-tight uppercase" style={{ color: "#0f172a" }}>
                  Tirhut Division Commissioner Office
                </h1>
                <p className="text-[11px] font-medium font-mono uppercase tracking-wider" style={{ color: "#64748b" }}>
                  Online Scheme Monitoring System (OSMS) &bull; Bihar administrative desk
                </p>
              </div>
              <div className="text-right pl-4 space-y-0.5" style={{ borderLeft: "2px solid #e2e8f0" }}>
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                  OFFICIAL PROGRESS REPORT
                </span>
                <p className="text-[9px] font-mono mt-1" style={{ color: "#94a3b8" }}>Report ID: OSMS-TIR-{selectedMonth.substring(0,3).toUpperCase()}-{selectedYear}</p>
              </div>
            </div>

            {/* Document metadata block */}
            <div className="grid grid-cols-2 gap-6 rounded-2xl p-4 text-xs" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="space-y-1">
                <p><span className="font-semibold" style={{ color: "#64748b" }}>Divisional Focus Region:</span> <span className="font-bold" style={{ color: "#0f172a" }}>{reportDistrict}</span></p>
                <p><span className="font-semibold" style={{ color: "#64748b" }}>Reporting Month & Year:</span> <span className="font-bold" style={{ color: "#0f172a" }}>{selectedMonth} {selectedYear}</span></p>
                <p><span className="font-semibold" style={{ color: "#64748b" }}>Database Submission Count:</span> <span className="font-bold font-mono" style={{ color: "#0f172a" }}>{recordList.length} unique returns</span></p>
              </div>
              <div className="space-y-1 text-right">
                <p><span className="font-semibold" style={{ color: "#64748b" }}>Report Compiled on:</span> <span className="font-medium inline-block" style={{ color: "#334155" }}>{new Date().toLocaleString("en-IN")}</span></p>
                <p><span className="font-semibold" style={{ color: "#64748b" }}>Generating User Authority:</span> <span className="font-medium inline-block" style={{ color: "#334155" }}>{currentUser}</span></p>
                <p className="text-[10px] font-bold flex items-center justify-end gap-1 font-mono" style={{ color: "#059669" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
                  AUTHENTICATED INTEGRITY DIGEST SINK
                </p>
              </div>
            </div>

            {/* Section 1: Consolidated Numbers */}
            <div className="pt-2">
              <h2 className="text-[11px] font-mono uppercase tracking-widest font-bold mb-3" style={{ color: "#94a3b8" }}>
                1. Consolidated Return Highlights & Metrics
              </h2>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl space-y-0.5" style={{ border: "1px solid rgba(226, 232, 240, 0.8)", backgroundColor: "rgba(248, 250, 252, 0.5)" }}>
                  <span className="text-[9px] font-mono uppercase tracking-wider block" style={{ color: "#64748b" }}>Total Allocated</span>
                  <span className="text-sm font-bold font-mono block" style={{ color: "#0f172a" }}>₹{(totalAlloc / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="p-3 rounded-xl space-y-0.5" style={{ border: "1px solid rgba(226, 232, 240, 0.8)", backgroundColor: "rgba(248, 250, 252, 0.5)" }}>
                  <span className="text-[9px] font-mono uppercase tracking-wider block" style={{ color: "#64748b" }}>Total Expenditure</span>
                  <span className="text-sm font-bold font-mono block" style={{ color: "#0f172a" }}>₹{(totalExp / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="p-3 rounded-xl space-y-0.5" style={{ border: "1px solid #fde68a", backgroundColor: "rgba(254, 243, 199, 0.4)" }}>
                  <span className="text-[9px] font-mono uppercase tracking-wider font-semibold block" style={{ color: "#b45309" }}>Avg Financial Util</span>
                  <span className="text-sm font-black font-mono block" style={{ color: "#b45309" }}>{avgUtil}%</span>
                </div>
                <div className="p-3 rounded-xl space-y-0.5" style={{ border: "1px solid #a7f3d0", backgroundColor: "rgba(209, 250, 229, 0.4)" }}>
                  <span className="text-[9px] font-mono uppercase tracking-wider font-semibold block" style={{ color: "#065f46" }}>Avg Target Coverage</span>
                  <span className="text-sm font-black font-mono block" style={{ color: "#065f46" }}>{avgCoverage}%</span>
                </div>
              </div>
            </div>

            {/* Section 2: Visual Charts (Requested bar charts & pie charts) */}
            <div className="pt-4 grid grid-cols-2 gap-6">
              {/* Left Chart: SVG Doughnut Pie Chart representing coverage */}
              <div className="rounded-2xl p-4 space-y-3 flex flex-col justify-between" style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                <div className="text-center">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest block" style={{ color: "#94a3b8" }}>
                    Beneficiary Target Coverage
                  </span>
                  <h3 className="text-xs font-serif font-bold text-slate-800" style={{ color: "#1e293b" }}>
                    Coverage vs Target Demographics
                  </h3>
                </div>

                <div className="flex justify-center items-center relative py-2">
                  <svg width="150" height="150" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="45" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="45" 
                      fill="transparent" 
                      stroke="#059669" 
                      strokeWidth="12"
                      strokeDasharray={`${strokeDashVal} ${strokeRemainingVal}`}
                      strokeDashoffset="78.5"
                      strokeLinecap="round" 
                    />
                    <text x="60" y="63" textAnchor="middle" className="text-lg font-extrabold font-sans" style={{ fill: "#1e293b" }}>
                      {avgCoverage}%
                    </text>
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded-xl" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div className="text-center">
                    <span className="block uppercase font-mono text-[8px]" style={{ color: "#94a3b8" }}>Demographics</span>
                    <span className="font-bold font-mono" style={{ color: "#1e293b" }}>{totalTargetBen.toLocaleString()}</span>
                  </div>
                  <div className="text-center border-l" style={{ borderLeft: "1px solid #e2e8f0" }}>
                    <span className="block uppercase font-mono text-[8px]" style={{ color: "#10b981" }}>Active Covered</span>
                    <span className="font-bold font-mono" style={{ color: "#059669" }}>{totalCoveredBen.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Chart: Custom horizontal bar chart representing financial utilization per record */}
              <div className="rounded-2xl p-4 space-y-3 flex flex-col justify-between" style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                <div className="text-center">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest block" style={{ color: "#94a3b8" }}>
                    Financial Utilization Comparison
                  </span>
                  <h3 className="text-xs font-serif font-bold" style={{ color: "#1e293b" }}>
                    Expenditure to Allocation Ratio
                  </h3>
                </div>

                <div className="space-y-2.5 py-1">
                  {recordList.slice(0, 5).map((record) => {
                    const targetScheme = schemes.find((sc) => sc.id === record.schemeId);
                    return (
                      <div key={record.id} className="mb-3">
                        <div className="flex justify-between items-start text-[10px] pb-1">
                          <span className="font-semibold block max-w-[310px]" style={{ color: "#0f172a", fontWeight: "700", whiteSpace: "normal", wordBreak: "break-word", lineHeight: "1.4" }}>
                            {targetScheme ? `${targetScheme.code} - ${targetScheme.name}` : record.schemeId.toUpperCase()} ({record.district})
                          </span>
                          <span className="font-mono font-bold shrink-0 pl-2 leading-normal" style={{ color: "#b45309" }}>
                            {record.utilizationPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${Math.min(100, record.utilizationPercentage)}%`, backgroundColor: "#d97706" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {recordList.length === 0 && (
                    <p className="text-[9px] font-mono text-center" style={{ color: "#94a3b8" }}>
                      No matching metrics to visualize
                    </p>
                  )}
                </div>

                <div className="p-2 rounded-xl text-center" style={{ backgroundColor: "rgba(254, 243, 199, 0.4)", border: "1px solid rgba(253, 230, 138, 0.5)" }}>
                  <span className="text-[8px] uppercase tracking-widest font-mono block" style={{ color: "#92400e" }}>Aggregate Ratio</span>
                  <span className="font-mono text-xs font-bold" style={{ color: "#b45309" }}>Overall Div. Rate: {avgUtil}%</span>
                </div>
              </div>
            </div>

            {/* Section 3: Submission Details register table */}
            <div className="pt-2">
              <h2 className="text-[11px] font-mono uppercase tracking-widest font-bold mb-3" style={{ color: "#94a3b8" }}>
                2. Divisional Scheme Return Registry Log
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b uppercase font-mono tracking-wider font-semibold" style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Scheme Details / Name</th>
                      <th className="py-2.5 px-3 font-mono">Period</th>
                      <th className="py-2.5 px-3 text-right">Budget Allocation</th>
                      <th className="py-2.5 px-3 text-right">Expenditure</th>
                      <th className="py-2.5 px-3 text-center">Util %</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recordList.slice(0, 8).map((record) => {
                      const scRef = schemes.find((s) => s.id === record.schemeId);
                      return (
                        <tr key={record.id} style={{ color: "#334155" }}>
                          <td className="py-2 px-3 font-semibold" style={{ color: "#0f172a" }}>{record.district}</td>
                          <td className="py-2 px-3 font-mono" style={{ color: "#334155" }}>
                            <div className="font-bold" style={{ color: "#0f172a" }}>{scRef?.code || record.schemeId.toUpperCase()}</div>
                            {scRef?.name && (
                              <div className="text-[9px] font-sans text-slate-500 leading-normal max-w-[210px]" style={{ color: "#475569", whiteSpace: "normal", wordBreak: "break-word" }}>
                                {scRef.name}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono">{record.month} {record.year}</td>
                          <td className="py-2 px-3 text-right font-mono">₹{record.totalAllocation.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono">₹{record.cumulativeExpenditure.toLocaleString()}</td>
                          <td className="py-2 px-3 text-center font-mono font-semibold" style={{ color: "#b45309" }}>{record.utilizationPercentage}%</td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-[9px] uppercase font-bold" style={{ color: "#64748b" }}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {recordList.length > 8 && (
                <p className="text-[9px] font-mono text-center mt-2.5" style={{ color: "#94a3b8" }}>
                  Showing first 8 of {recordList.length} rows total. Remaining records preserved in online system.
                </p>
              )}
            </div>
            
            {/* Direct observations extracted block */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <span className="text-[8px] font-mono uppercase tracking-widest block font-semibold" style={{ color: "#64748b" }}>Reported Infrastructure Hurdles</span>
                <p className="text-[10px] mt-1 italic leading-relaxed" style={{ color: "#475569" }}>
                  {recordList.find((r) => r.challenges && r.challenges.trim().length > 3)?.challenges || "Zero logistical constraints or active bottlenecks reported across active district return matrices."}
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <span className="text-[8px] font-mono uppercase tracking-widest block font-semibold" style={{ color: "#64748b" }}>Special Operational Directives</span>
                <p className="text-[10px] mt-1 italic leading-relaxed" style={{ color: "#475569" }}>
                  {recordList.find((r) => r.remarks && r.remarks.trim().length > 3)?.remarks || "All monitored schematics demonstrate compliance with standard divisional audit schedules."}
                </p>
              </div>
            </div>
          </div>

          {/* Stamp Sign-off Area */}
          <div className="pt-8" style={{ borderTop: "1px solid #e2e8f0" }}>
            <div className="flex justify-between items-end text-center">
              <div className="space-y-4">
                <div className="w-32 mx-auto" style={{ borderBottom: "1px solid #cbd5e1" }} />
                <p className="text-[9px] uppercase tracking-wider font-mono" style={{ color: "#64748b" }}>Divisional Registrar<br/>(OSMS Verification)</p>
              </div>
              <div className="p-2 text-[10px] rounded-xl flex flex-col items-center max-w-[200px]" style={{ backgroundColor: "rgba(254, 243, 199, 0.5)", border: "1px solid #fde68a" }}>
                <span className="font-bold uppercase tracking-wider text-[8px] font-mono text-center" style={{ color: "#92400e" }}>Bihar State Govt Seal</span>
                <span className="text-[9px] italic block mt-1" style={{ color: "#475569" }}>Authentic Administrative Return</span>
              </div>
              <div className="space-y-4">
                <div className="w-32 mx-auto" style={{ borderBottom: "1px solid #cbd5e1" }} />
                <p className="text-[9px] uppercase tracking-wider font-mono" style={{ color: "#64748b" }}>Divisional Commissioner<br/>Tirhut Division</p>
              </div>
            </div>
            <div className="text-center pt-6 text-[8px] font-mono" style={{ color: "#94a3b8" }}>
              Generated by Tirhut Divisional Administrative Control Desk Server. This report forms official documentation of the public works division of Bihar.
            </div>
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-100">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              {confirmAction.type === "approve" && (
                <div className="p-2.5 bg-emerald-950/50 rounded-xl border border-emerald-800">
                  <CheckSquare className="w-6 h-6 text-emerald-400" />
                </div>
              )}
              {confirmAction.type === "reject" && (
                <div className="p-2.5 bg-rose-950/50 rounded-xl border border-rose-800">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
              )}
              {confirmAction.type === "delete" && (
                <div className="p-2.5 bg-rose-950/50 rounded-xl border border-rose-800">
                  <Trash2 className="w-6 h-6 text-rose-400" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-sans tracking-wide">
                  {confirmAction.type === "approve" && "Confirm Submission Approval"}
                  {confirmAction.type === "reject" && "Provide Rejection Reason"}
                  {confirmAction.type === "delete" && "Permanent Record Deletion"}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  District: {confirmAction.record.district} &bull; Scheme: {confirmAction.record.schemeId.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed font-sans">
              {confirmAction.type === "approve" && (
                <span>
                  Are you sure you want to approve this monthly progress submission? Approved submissions are locked for child edits and publishable immediately to divisional metrics dashboards.
                </span>
              )}
              {confirmAction.type === "reject" && (
                <div className="space-y-3">
                  <span>
                    This submission will be returned with status <strong>Rejected</strong>. The District Officer will be notified to correct and re-submit immediately.
                  </span>
                  <div className="space-y-1.5 text-slate-300">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Rejection Comments / Directives</label>
                    <textarea
                      value={confirmAction.comment || ""}
                      onChange={(e) => setConfirmAction({ ...confirmAction, comment: e.target.value })}
                      placeholder="Add specific comments or directions for corrections..."
                      rows={3}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-rose-500 transition-colors"
                      autoFocus
                    />
                  </div>
                </div>
              )}
              {confirmAction.type === "delete" && (
                <span>
                  Are you sure you want to delete this record permanently? This action is irreversible and deletes full database records, attachment metadata, and active performance historical references.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-[11px] font-sans font-bold uppercase tracking-wider bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === "approve") {
                    onSaveSubmission({ ...confirmAction.record, status: "Approved" });
                  } else if (confirmAction.type === "reject") {
                    onSaveSubmission({
                      ...confirmAction.record,
                      status: "Rejected",
                      remarks: confirmAction.comment 
                        ? `Rejected: ${confirmAction.comment}. ${confirmAction.record.remarks || ""}`
                        : confirmAction.record.remarks
                    });
                  } else if (confirmAction.type === "delete") {
                    onDeleteSubmission(confirmAction.record.id);
                  }
                  setConfirmAction(null);
                }}
                className={`px-4 py-2 text-[11px] font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md ${
                  confirmAction.type === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white"
                }`}
              >
                {confirmAction.type === "approve" && "Approve Return"}
                {confirmAction.type === "reject" && "Reject & Return"}
                {confirmAction.type === "delete" && "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
