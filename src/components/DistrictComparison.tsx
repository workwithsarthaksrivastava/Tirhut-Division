import React, { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyProgress, Scheme, ALL_YEARS, ALL_MONTHS } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  HelpCircle,
  Clock,
  Briefcase,
  Users,
  AlertCircle
} from "lucide-react";

interface DistrictComparisonProps {
  submissions: MonthlyProgress[];
  schemes: Scheme[];
  globalMonth: string;
  globalYear: string;
  isDarkMode: boolean;
}

export default function DistrictComparison({
  submissions,
  schemes,
  globalMonth,
  globalYear,
  isDarkMode,
}: DistrictComparisonProps) {
  const districts = ["Muzaffarpur", "Sitamarhi", "Sheohar", "East Champaran", "West Champaran", "Vaishali"];
  
  // Local state for comparing districts
  const [districtA, setDistrictA] = useState<string>("Muzaffarpur");
  const [districtB, setDistrictB] = useState<string>("Sitamarhi");
  
  // Local state for Period (defaults to global, but let user change)
  const [selectedMonth, setSelectedMonth] = useState<string>(globalMonth);
  const [selectedYear, setSelectedYear] = useState<string>(globalYear);

  // Sync with global period changes if they occur
  React.useEffect(() => {
    setSelectedMonth(globalMonth);
    setSelectedYear(globalYear);
  }, [globalMonth, globalYear]);

  const months = ALL_MONTHS;
  const years = ALL_YEARS;

  // Helper to compute metrics for a specific district
  const getDistrictPerformance = (distName: string) => {
    const records = submissions.filter(
      (s) => s.district === distName && s.month === selectedMonth && s.year === selectedYear
    );

    if (records.length > 0) {
      // 1. Fund Utilization
      const totalAllocation = records.reduce((sum, r) => sum + r.totalAllocation, 0);
      const cumulativeExpenditure = records.reduce((sum, r) => sum + r.cumulativeExpenditure, 0);
      const fundUtilization = totalAllocation > 0 ? (cumulativeExpenditure / totalAllocation) * 100 : 0;

      // 2. Beneficiary Cover
      const targetBeneficiaries = records.reduce((sum, r) => sum + r.targetBeneficiaries, 0);
      const coveredBeneficiaries = records.reduce((sum, r) => sum + r.coveredBeneficiaries, 0);
      const beneficiaryCover = targetBeneficiaries > 0 ? (coveredBeneficiaries / targetBeneficiaries) * 100 : 0;

      // 3. Project Delivery (Completed / Approved)
      const projectsApproved = records.reduce((sum, r) => sum + r.projectsApproved, 0);
      const projectsCompleted = records.reduce((sum, r) => sum + r.projectsCompleted, 0);
      const projectDelivery = projectsApproved > 0 ? (projectsCompleted / projectsApproved) * 100 : 0;

      // 4. Staff Occupancy
      const staffingSanctioned = records.reduce((sum, r) => sum + r.staffingSanctioned, 0);
      const staffingWorking = records.reduce((sum, r) => sum + r.staffingWorking, 0);
      const staffOccupancy = staffingSanctioned > 0 ? (staffingWorking / staffingSanctioned) * 100 : 0;

      // 5. Grievance Resolve
      const complaintsReceived = records.reduce((sum, r) => sum + r.complaintsReceived, 0);
      const complaintsResolved = records.reduce((sum, r) => sum + r.complaintsResolved, 0);
      const grievanceResolve = complaintsReceived > 0 ? (complaintsResolved / complaintsReceived) * 100 : 0;

      return {
        fundUtilization: Math.round(Math.min(100, fundUtilization)),
        beneficiaryCover: Math.round(Math.min(100, beneficiaryCover)),
        projectDelivery: Math.round(Math.min(100, projectDelivery)),
        staffOccupancy: Math.round(Math.min(100, staffOccupancy)),
        grievanceResolve: Math.round(Math.min(100, grievanceResolve)),
        recordCount: records.length,
        totalAllocation,
        cumulativeExpenditure,
        isMocked: false
      };
    } else {
      const defaults = { fundUtilization: 0, beneficiaryCover: 0, projectDelivery: 0, staffOccupancy: 0, grievanceResolve: 0 };
      return {
        ...defaults,
        recordCount: 0,
        totalAllocation: 0,
        cumulativeExpenditure: 0,
        isMocked: true
      };
    }
  };

  const perfA = getDistrictPerformance(districtA);
  const perfB = getDistrictPerformance(districtB);

  const radarCategories = [
    { key: "fundUtilization", subject: "Fund Utilization" },
    { key: "beneficiaryCover", subject: "Beneficiary Cover" },
    { key: "projectDelivery", subject: "Project Delivery" },
    { key: "staffOccupancy", subject: "Staff Occupancy" },
    { key: "grievanceResolve", subject: "Grievance Resolve" },
  ];

  // Recharts requires exact shape
  const chartData = radarCategories.map((cat) => ({
    subject: cat.subject,
    [districtA]: perfA[cat.key as keyof typeof perfA],
    [districtB]: perfB[cat.key as keyof typeof perfB],
    fullMark: 100,
  }));

  // Automatic Bottleneck & Gap Analysis Generator
  const generateGapsAndBottlenecks = () => {
    const gaps: {
      category: string;
      difference: number;
      leader: string;
      laggard: string;
      level: "Critical" | "Warning" | "Moderate";
      advice: string;
    }[] = [];

    radarCategories.forEach((cat) => {
      const valA = perfA[cat.key as keyof typeof perfA] as number;
      const valB = perfB[cat.key as keyof typeof perfB] as number;
      const diff = Math.abs(valA - valB);

      if (diff >= 5) {
        const leader = valA > valB ? districtA : districtB;
        const laggard = valA > valB ? districtB : districtA;
        const difference = diff;

        let level: "Critical" | "Warning" | "Moderate" = "Moderate";
        if (diff >= 15) level = "Critical";
        else if (diff >= 10) level = "Warning";

        // Custom contextual advice
        let advice = "";
        if (cat.key === "fundUtilization") {
          advice = `Unlock administrative blockages in ${laggard}. Standardize invoice cycles & match ${leader}'s deployment agility.`;
        } else if (cat.key === "beneficiaryCover") {
          advice = `Accelerate field validation camps to extend beneficiary lists in ${laggard}, replicating ${leader}'s grassroot outreach drive.`;
        } else if (cat.key === "projectDelivery") {
          advice = `Resolve vendor management issues & audit contracting delays in ${laggard} to meet the delivery rate shown by ${leader}.`;
        } else if (cat.key === "staffOccupancy") {
          advice = `Initiate temporary state transfers or expedite sanction hiring in ${laggard} to match stable personnel rates in ${leader}.`;
        } else if (cat.key === "grievanceResolve") {
          advice = `Establish digital grievance cells & tracking thresholds in ${laggard} to accelerate resolve rates and match ${leader}.`;
        }

        gaps.push({
          category: cat.subject,
          difference,
          leader,
          laggard,
          level,
          advice
        });
      }
    });

    return gaps.sort((a, b) => b.difference - a.difference);
  };

  const bottleneckReports = generateGapsAndBottlenecks();

  return (
    <div className={`space-y-8 animate-fade-in transition-all ${
      isDarkMode ? "text-slate-100" : "text-slate-800"
    }`}>
      {/* Top Controls Cockpit Banner */}
      <div className={`border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
        isDarkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="space-y-1.5 max-w-xl">
          <h2 className={`font-sans font-bold text-xl flex items-center gap-2.5 ${
            isDarkMode ? "text-slate-100" : "text-slate-900"
          }`}>
            <Layers className="w-5 h-5 text-amber-500" />
            <span>District Performance Overlay Cockpit</span>
          </h2>
          <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Overlay key diagnostic indices between two selected districts. Real-time statistical analysis automatically flags critical program delays and localized program deficiencies.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono uppercase text-slate-500">Target Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-500 transition-colors"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono uppercase text-slate-500">Target Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-500 transition-colors"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selector Panels & Visual overlay area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Selecting districts + Visual overlay radar chart */}
        <div className={`lg:col-span-7 border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
              <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase text-amber-500 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Primary District (A)
                </label>
                <select
                  value={districtA}
                  onChange={(e) => {
                    setDistrictA(e.target.value);
                    if (e.target.value === districtB) {
                      // Swap to avoid selecting the same
                      const remaining = districts.find((d) => d !== e.target.value);
                      if (remaining) setDistrictB(remaining);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  {districts.map((d) => (
                    <option key={d} value={d} disabled={d === districtB}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase text-blue-400 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Secondary District (B)
                </label>
                <select
                  value={districtB}
                  onChange={(e) => {
                    setDistrictB(e.target.value);
                    if (e.target.value === districtA) {
                      const remaining = districts.find((d) => d !== e.target.value);
                      if (remaining) setDistrictA(remaining);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {districts.map((d) => (
                    <option key={d} value={d} disabled={d === districtA}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[320px] flex items-center justify-center py-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={10} fontWeight="600" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0F172A", 
                      borderColor: "#334155", 
                      borderRadius: "12px",
                      color: "#F8FAFC",
                      fontSize: "12px"
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Radar
                    name={`${districtA} Index`}
                    dataKey={districtA}
                    stroke="#D97706"
                    fill="#D97706"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name={`${districtB} Index`}
                    dataKey={districtB}
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row sm:justify-between gap-2">
            <span>Period Base: {selectedMonth} {selectedYear} System Registry</span>
            <span className={perfA.isMocked || perfB.isMocked ? "text-amber-500/80" : "text-emerald-500/80"}>
              {perfA.isMocked || perfB.isMocked 
                ? "*Displaying standard baseline statistics (Live returns currently pending)"
                : "✔ Live database reports aggregated successfully"}
            </span>
          </div>
        </div>

        {/* Right Side: Metrics Scorecard + Dynamic Gap Analysis */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Stats Grid Overlay */}
          <div className={`border rounded-3xl p-5 shadow-xl space-y-4 transition-all ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Comparative Metrics Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">{districtA} Active Registry</span>
                <span className="font-bold text-sm text-slate-200">{perfA.recordCount} submissions</span>
                <span className="text-[10px] font-mono text-slate-500 block">Allocation: ₹{(perfA.totalAllocation / 10000000).toFixed(2)} Cr</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">{districtB} Active Registry</span>
                <span className="font-bold text-sm text-slate-200">{perfB.recordCount} submissions</span>
                <span className="text-[10px] font-mono text-slate-500 block">Allocation: ₹{(perfB.totalAllocation / 10000000).toFixed(2)} Cr</span>
              </div>
            </div>
          </div>

          {/* Automatic Bottleneck analyzer panel */}
          <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-all ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 font-sans">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Regional Bottleneck Diagnostic</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Automatically identifies regional performance divides & provides administrative steps to close regional gaps.
              </p>
            </div>

            <div className="space-y-3.5 max-h-[305px] overflow-y-auto pr-1">
              {bottleneckReports.length > 0 ? (
                bottleneckReports.map((report) => (
                  <div 
                    key={report.category} 
                    className="bg-slate-950/85 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-slate-200 font-sans">{report.category} Gap</span>
                      <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                        report.level === "Critical" 
                          ? "bg-rose-950/80 text-rose-400 border border-rose-900/40" 
                          : report.level === "Warning" 
                          ? "bg-amber-950/80 text-amber-400 border border-amber-900/40" 
                          : "bg-blue-950/80 text-blue-400 border border-blue-900/40"
                      }`}>
                        {report.level} divide ({Math.round(report.difference)}%)
                      </span>
                    </div>

                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <strong>{report.leader}</strong> leads this period with <strong className="text-emerald-400 font-mono">{perfA[report.category === "Fund Utilization" ? "fundUtilization" : report.category === "Beneficiary Cover" ? "beneficiaryCover" : report.category === "Project Delivery" ? "projectDelivery" : report.category === "Staff Occupancy" ? "staffOccupancy" : "grievanceResolve" as keyof typeof perfA]}%</strong>. <strong className="text-rose-500">{report.laggard}</strong> lags with a score of <strong className="text-rose-400 font-mono">{perfB[report.category === "Fund Utilization" ? "fundUtilization" : report.category === "Beneficiary Cover" ? "beneficiaryCover" : report.category === "Project Delivery" ? "projectDelivery" : report.category === "Staff Occupancy" ? "staffOccupancy" : "grievanceResolve" as keyof typeof perfB]}%</strong>.
                    </p>

                    <div className="bg-slate-900/60 py-2 px-3 rounded-xl border border-slate-800/40 text-[10px] text-slate-400 flex items-start gap-1.5 leading-normal">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{report.advice}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-950/60 py-8 px-4 rounded-2xl border border-slate-800/50 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="text-xs font-semibold text-slate-300">Perfect Regional Equilibrium</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                    No discrepancies exceeding 5% detected across the metrics. Both districts maintain aligned developmental trajectories.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
