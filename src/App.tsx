import React, { useState } from "react";
import { Scheme, MonthlyProgress, UserSession, AuditLog, SchemeNotification } from "./types";
import {
  INITIAL_SCHEMES,
  INITIAL_SUBMISSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from "./initialData";

import LoginScreen from "./components/LoginScreen";
import TirhutMap from "./components/TirhutMap";
import TirhutCharts from "./components/TirhutCharts";
import SchemeForm from "./components/SchemeForm";
import DynamicSchemeManager from "./components/DynamicSchemeManager";
import DistrictComparison from "./components/DistrictComparison";

import {
  Layers,
  Heart,
  User,
  LogOut,
  Bell,
  Sun,
  Moon,
  Clock,
  Settings,
  ShieldCheck,
  Landmark,
  PlusSquare,
  BarChart4,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function App() {
  const [session, setSession] = useState<UserSession>({
    district: "",
    role: "District Officer",
    isLoggedIn: false,
  });

  // State arrays syncing to initial datasets as default fallback
  const [schemes, setSchemes] = useState<Scheme[]>(INITIAL_SCHEMES);
  const [submissions, setSubmissions] = useState<MonthlyProgress[]>(INITIAL_SUBMISSIONS);
  const [notifications, setNotifications] = useState<SchemeNotification[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Fetch full dataset from database endpoints on boot
  React.useEffect(() => {
    const syncDatabase = async () => {
      try {
        const [resSchemes, resSubmissions, resNotifications, resAuditLogs] = await Promise.all([
          fetch("/api/schemes").then(r => r.json()),
          fetch("/api/submissions").then(r => r.json()),
          fetch("/api/notifications").then(r => r.json()),
          fetch("/api/audit-logs").then(r => r.json())
        ]);
        if (resSchemes && resSchemes.length > 0) setSchemes(resSchemes);
        if (resSubmissions && resSubmissions.length > 0) setSubmissions(resSubmissions);
        if (resNotifications && resNotifications.length > 0) setNotifications(resNotifications);
        if (resAuditLogs && resAuditLogs.length > 0) setAuditLogs(resAuditLogs);
      } catch (err) {
        console.warn("Express-Supabase DB sync not initialized yet. Using local fallback cache.", err);
      }
    };
    syncDatabase();
  }, []);

  // Filter conditions
  const [selectedMonth, setSelectedMonth] = useState<string>("April");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Muzaffarpur");

  // Multi-view navigation tracker
  // "analytics" | "entry" | "schemes" | "audit" | "comparison"
  const [currentView, setCurrentView] = useState<"analytics" | "entry" | "schemes" | "audit" | "comparison">("analytics");

  // Premium Dark Mode / Light Mode styling selector
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Notification menu popover
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);

  // Authenticate user successfully
  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setCurrentView("analytics");
    
    // Default district focus based on role
    if (userSession.role === "District Officer") {
      setSelectedDistrict(userSession.district);
    } else {
      setSelectedDistrict("All Tirhut Division");
    }

    // Add log
    appendAuditLog("Establish Secure Session", `Verified authentication and initialized session role of ${userSession.role}`);
  };

  const handleLogout = () => {
    appendAuditLog("Terminate Session", `Explicit user log-out Action recorded.`);
    setSession({ district: "", role: "District Officer", isLoggedIn: false });
    setCurrentView("analytics");
  };

  // Helper appending dynamic logs
  const appendAuditLog = async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      username: session.role === "District Officer" ? `${session.district.toLowerCase()}_officer` : "commissioner_admin",
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: "10.128." + Math.floor(Math.random() * 50 + 1) + "." + Math.floor(Math.random() * 200 + 1),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog)
      });
    } catch (e) {
      console.warn("Audit logs network save postponed:", e);
    }
  };

  // Save progress records (Create or Update)
  const handleSaveProgress = async (record: MonthlyProgress) => {
    const isEdit = submissions.some((s) => s.id === record.id);
    
    setSubmissions((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === record.id);
      if (existsIndex >= 0) {
        // Edit action
        const copy = [...prev];
        copy[existsIndex] = record;
        return copy;
      } else {
        // Create action
        return [record, ...prev];
      }
    });

    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
    } catch (e) {
      console.warn("Submissions network save postponed:", e);
    }

    appendAuditLog(
      isEdit ? "Modify Scheme Return" : "Submit Scheme Return",
      `Saved ${record.status} progress records for ${record.district} - Scheme: ${record.schemeId}`
    );

    // If utilization below threshold, trigger notification warning
    if (record.utilizationPercentage < 60 && record.status === "Submitted") {
      const newNotif: SchemeNotification = {
        id: `notif-${Date.now()}`,
        type: "Warning",
        message: `Alert: Low Fund utilization performance (${record.utilizationPercentage}%) warning triggered in ${record.district} under scheme ${record.schemeId}.`,
        district: record.district,
        schemeName: record.schemeId,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newNotif)
        });
      } catch (e) {
        console.warn("Notifications network dispatch failed:", e);
      }
    }
  };

  // Delete records
  const handleDeleteProgress = async (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    appendAuditLog("Purge Record", `Deleted scheme progress submission with internal ID: ${id}`);

    try {
      await fetch(`/api/submissions/${id}`, {
        method: "DELETE"
      });
    } catch (e) {
      console.warn("Submissions deletion update failed:", e);
    }
  };

  // Register dynamic schemes (Admin only)
  const handleAddScheme = async (newScheme: Scheme) => {
    setSchemes((prev) => [...prev, newScheme]);
    appendAuditLog("Onboard Scheme", `Dynamic deployment of new scheme template: ${newScheme.name} (${newScheme.code})`);

    try {
      await fetch("/api/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newScheme)
      });
    } catch (e) {
      console.warn("Dynamic scheme sync failed:", e);
    }
  };

  // Delete dynamic schemes (Admin only)
  const handleDeleteScheme = async (id: string, name: string) => {
    setSchemes((prev) => prev.filter((s) => s.id !== id));
    appendAuditLog("Delete Scheme", `Dynamic removal of scheme template: ${name}`);

    try {
      await fetch(`/api/schemes/${id}`, {
        method: "DELETE"
      });
    } catch (e) {
      console.warn("Dynamic scheme delete failed:", e);
    }
  };

  // Count unread notifications
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await fetch("/api/notifications/read-all", {
        method: "POST"
      });
    } catch (e) {
      console.warn("Notifications state clearing postponed:", e);
    }
  };

  // Style helper mapping
  const themeBgClasses = isDarkMode 
    ? "bg-cultural-dark text-ivory-cream" 
    : "bg-ivory-cream text-cultural-dark";

  if (!session.isLoggedIn) {
    return (
      <div className={`min-h-screen transition-colors duration-500 bg-cultural-darker`}>
        {/* Subtle decorative header layout */}
        <div className="max-w-6xl mx-auto pt-6 px-4 flex justify-between items-center bg-cultural-darker/60 backdrop-blur-md rounded-2xl py-3 border border-saffron/10 mt-2">
          <div className="flex items-center gap-1.5 font-sans font-extrabold text-saffron tracking-wider text-xs">
            <Landmark className="w-5 h-5 text-saffron" />
            <span title="Tirhut Integrated Scheme Monitoring, Analytics & Planning">TISMAP PORTAL</span>
          </div>
          <span className="text-[10px] text-marigold-gold font-mono">TIRHUT INTEGRATED SCHEME MONITORING, ANALYTICS & PLANNING</span>
        </div>

        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeBgClasses} font-sans pb-12`}>
      {/* Dynamic Saffron/Crimson Header border representing Mithila Madhubani art alignment */}
      <div className="h-2.5 w-full bg-gradient-to-r from-saffron via-crimson-sindoor to-marigold-gold shadow-md" />

      {/* Main Top Header Controls */}
      <header className={`border-b ${isDarkMode ? "border-saffron/20 bg-cultural-card-dark/60" : "border-saffron/20 bg-white shadow-sm"} backdrop-blur-xl sticky top-0 z-40 transition-all`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Visual cultural logo badge */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-saffron to-crimson-sindoor flex items-center justify-center p-1 cursor-pointer shadow-md">
              <span className="text-ivory-cream font-serif font-bold text-xs">तिर</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-serif font-bold text-sm tracking-tight md:text-base ${isDarkMode ? "text-ivory-cream" : "text-cultural-dark"}`}>
                  TISMAP <span className="text-saffron">Tirhut Division</span>
                </h1>
                <span className={`hidden sm:inline-block text-[9px] border font-mono font-bold px-1.5 py-0.2 rounded ${
                  isDarkMode ? "bg-cultural-card-dark border-saffron/30 text-marigold-gold" : "bg-ivory-cream border-saffron/20 text-saffron"
                }`}>
                  v2.0-COMMISSIONER
                </span>
              </div>
              <p className={`text-[9px] font-mono hidden md:block ${isDarkMode ? "text-ivory-cream/60" : "text-cultural-dark/60"}`}>
                Tirhut Integrated Scheme Monitoring, Analytics & Planning Portal (TISMAP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Indicators */}
            <div className={`hidden lg:flex items-center gap-2 text-[10px] font-mono p-1.5 px-3 rounded-xl border transition-colors ${
              isDarkMode 
                ? "bg-cultural-darker border-saffron/20 text-ivory-cream/85" 
                : "bg-white border-saffron/20 text-cultural-dark/85"
            }`}>
              <span className="w-2 h-2 rounded-full bg-saffron inline-block animate-ping" />
              <span>Scope: {session.district}</span>
              <span className={isDarkMode ? "text-saffron/30" : "text-saffron/20"}>|</span>
              <span>Period: {selectedMonth} {selectedYear}</span>
            </div>

            {/* Notification triggers */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (showNotifMenu) markAllNotificationsRead();
                }}
                className={`p-2.5 rounded-xl border transition-colors relative cursor-pointer ${
                  isDarkMode 
                    ? "bg-cultural-darker border-saffron/30 text-ivory-cream hover:bg-cultural-card-dark" 
                    : "bg-white border-saffron/20 text-cultural-dark hover:bg-ivory-cream"
                }`}
              >
                <Bell className="w-4 h-4 text-saffron" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-crimson-sindoor text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className={`absolute right-0 mt-2 w-80 border rounded-3xl p-4 shadow-2xl z-50 text-xs transition-all ${
                  isDarkMode ? "bg-cultural-card-dark border-saffron/30 text-ivory-cream" : "bg-white border-saffron/20 text-cultural-dark"
                }`}>
                  <div className={`flex justify-between items-center pb-2 border-b mb-2 ${isDarkMode ? "border-saffron/20" : "border-saffron/10"}`}>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-saffron">Notifications Center</span>
                    <button
                      onClick={() => {
                        markAllNotificationsRead();
                        setShowNotifMenu(false);
                      }}
                      className="text-[9px] text-saffron hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2 border rounded-xl space-y-1 ${
                        isDarkMode ? "bg-cultural-darker border-saffron/10" : "bg-ivory-cream/40 border-saffron/10"
                      }`}>
                        <div className="flex justify-between">
                          <span
                            className={`font-mono text-[8.5px] px-1 py-0.2 rounded font-bold uppercase ${
                              n.type === "Critical" ? "text-rose-200 bg-crimson-dark" : "text-marigold-gold bg-saffron-dark/40"
                            }`}
                          >
                            {n.type}
                          </span>
                          <span className="text-[8px] text-saffron/50 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={`text-[10px] pointer-events-none ${isDarkMode ? "text-ivory-cream/80" : "text-cultural-dark/85"}`}>{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode 
                  ? "bg-cultural-darker border-saffron/30 text-ivory-cream hover:bg-cultural-card-dark" 
                  : "bg-white border-saffron/20 text-cultural-dark hover:bg-ivory-cream"
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-marigold-gold animate-spin-slow" /> : <Moon className="w-4 h-4 text-saffron" />}
            </button>

            {/* Current user credential info */}
            <div className={`flex items-center gap-2 border-l pl-4 ${isDarkMode ? "border-saffron/20" : "border-saffron/20"}`}>
              <div className="text-right hidden sm:block">
                <div className={`text-xs font-bold ${isDarkMode ? "text-ivory-cream" : "text-cultural-dark"}`}>{session.role}</div>
                <div className={`text-[9px] font-mono ${isDarkMode ? "text-marigold-gold" : "text-saffron"}`}>{session.district}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-crimson-dark/40 p-2 text-saffron hover:text-white rounded-xl hover:bg-crimson-sindoor transition-all cursor-pointer"
                title="Secure Signout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Canvas Container Page Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR NAVIGATION PANEL */}
          <nav className="lg:col-span-3 space-y-4">
            <div className={`border rounded-2xl p-4 transition-all ${
              isDarkMode ? "bg-cultural-card-dark border-saffron/25 shadow-xl" : "bg-white border-saffron/20 shadow-sm"
            }`}>
              <h4 className={`text-[10px] font-mono uppercase tracking-widest px-3 mb-3 font-semibold ${
                isDarkMode ? "text-marigold-gold" : "text-saffron"
              }`}>Workspace Nav</h4>
              <div className="space-y-1">
                <button
                  onClick={() => setCurrentView("analytics")}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-sans font-medium flex items-center gap-3 transition-all cursor-pointer ${
                    currentView === "analytics"
                      ? "bg-gradient-to-r from-saffron to-crimson-sindoor text-white font-bold shadow-md"
                      : isDarkMode
                        ? "text-ivory-cream/75 hover:text-ivory-cream hover:bg-cultural-darker"
                        : "text-cultural-dark/75 hover:text-cultural-dark hover:bg-ivory-cream"
                  }`}
                >
                  <BarChart4 className="w-4 h-4 text-saffron-light" />
                  <span>Command Center View</span>
                </button>

                {(session.role === "District Officer" || session.role === "Commissioner Office" || session.role === "Admin") && (
                  <button
                    onClick={() => setCurrentView("entry")}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-sans font-medium flex items-center gap-3 transition-all cursor-pointer ${
                      currentView === "entry"
                        ? "bg-gradient-to-r from-saffron to-crimson-sindoor text-white font-bold shadow-md"
                        : isDarkMode
                          ? "text-ivory-cream/75 hover:text-ivory-cream hover:bg-cultural-darker"
                          : "text-cultural-dark/75 hover:text-cultural-dark hover:bg-ivory-cream"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-saffron-light" />
                    <span>
                      {session.role === "District Officer" 
                        ? "Scheme Data Entry" 
                        : session.role === "Commissioner Office"
                          ? "Records Management Registry"
                          : "Scheme Data & Records Registry"}
                    </span>
                  </button>
                )}

                {session.role === "Admin" && (
                  <button
                    onClick={() => setCurrentView("schemes")}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-sans font-medium flex items-center gap-3 transition-all cursor-pointer ${
                      currentView === "schemes"
                        ? "bg-gradient-to-r from-saffron to-crimson-sindoor text-white font-bold shadow-md"
                        : isDarkMode
                          ? "text-ivory-cream/75 hover:text-ivory-cream hover:bg-cultural-darker"
                          : "text-cultural-dark/75 hover:text-cultural-dark hover:bg-ivory-cream"
                    }`}
                  >
                    <PlusSquare className="w-4 h-4 text-saffron-light" />
                    <span>Dynamic Scheme Builder</span>
                  </button>
                )}

                <button
                  onClick={() => setCurrentView("audit")}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-sans font-medium flex items-center gap-3 transition-all cursor-pointer ${
                    currentView === "audit"
                      ? "bg-gradient-to-r from-saffron to-crimson-sindoor text-white font-bold shadow-md"
                      : isDarkMode
                        ? "text-ivory-cream/75 hover:text-ivory-cream hover:bg-cultural-darker"
                        : "text-cultural-dark/75 hover:text-cultural-dark hover:bg-ivory-cream"
                  }`}
                >
                  <Clock className="w-4 h-4 text-saffron-light" />
                  <span>Integrity Audit Trail</span>
                </button>

                {(session.role === "Commissioner Office" || session.role === "Admin") && (
                  <button
                    onClick={() => {
                      setCurrentView("comparison");
                      appendAuditLog("Open Comparison overlay", "Transitioned to District Performance overlay comparison screen.");
                    }}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-sans font-medium flex items-center gap-3 transition-all cursor-pointer ${
                      currentView === "comparison"
                        ? "bg-gradient-to-r from-saffron to-crimson-sindoor text-white font-bold shadow-md"
                        : isDarkMode
                          ? "text-ivory-cream/75 hover:text-ivory-cream hover:bg-cultural-darker"
                          : "text-cultural-dark/75 hover:text-cultural-dark hover:bg-ivory-cream"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-saffron-light" />
                    <span>District Comparison overlay</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Selection for Command Center */}
            {currentView === "analytics" && (
              <div className={`border rounded-2xl p-5 space-y-4 transition-all ${
                isDarkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className={`pb-1 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    isDarkMode ? "text-slate-300" : "text-slate-500"
                  }`}>Anchoring Filters</h4>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] font-mono uppercase">Month Interval</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`w-full rounded-lg p-2.5 text-xs focus:border-blue-500 transition-colors cursor-pointer outline-none ${
                        isDarkMode 
                          ? "bg-slate-950 border border-slate-800 text-slate-200" 
                          : "bg-slate-50 border border-slate-200 text-slate-800"
                      }`}
                    >
                      {["January", "February", "March", "April", "May", "June"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] font-mono uppercase">Reporting Year</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className={`w-full rounded-lg p-2.5 text-xs focus:border-blue-500 transition-colors cursor-pointer outline-none ${
                        isDarkMode 
                          ? "bg-slate-950 border border-slate-800 text-slate-200" 
                          : "bg-slate-50 border border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] font-mono uppercase">Anchored District Unit</span>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={session.role === "District Officer"}
                      className={`w-full rounded-lg p-2.5 text-xs focus:border-blue-500 transition-colors cursor-pointer outline-none disabled:opacity-50 ${
                        isDarkMode 
                          ? "bg-slate-950 border border-slate-800 text-slate-200" 
                          : "bg-slate-50 border border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="All Tirhut Division">All Tirhut Division (Consolidated)</option>
                      {["Muzaffarpur", "Sitamarhi", "Sheohar", "East Champaran", "West Champaran", "Vaishali"].map((d) => (
                        <option key={d} value={d}>
                          {d} Unit
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Mithila Saffron Lotus Custom Vector Motif to reinforce Tirhut Division Identity */}
            <div className={`border rounded-2xl p-5 relative overflow-hidden flex flex-col items-center text-center transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-sm"
            }`}>
              {/* Subtle glowing circular lines */}
              <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full border border-blue-500/10 -translate-x-1/2 -translate-y-1/2 -z-10 animate-ping duration-[3s]" />
              
              <svg viewBox="0 0 100 80" className="w-16 h-12 text-blue-600 opacity-60 mb-2 fill-current">
                {/* Traditional lotus vector outline */}
                <path d="M 50,15 C 45,35 25,45 25,60 C 25,65 50,75 50,75 C 50,75 75,65 75,60 C 75,45 55,35 50,15 Z" />
                <path d="M 50,25 C 40,40 10,48 10,65 C 10,75 45,78 50,78 C 55,78 90,75 90,65 C 90,48 60,40 50,25 Z" opacity="0.4" />
              </svg>
              <h5 className={`font-sans font-bold text-[11px] tracking-wider ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>MITHILA REGIONAL IDENTITY</h5>
              <p className="text-[10px] text-slate-400 font-serif leading-relaxed mt-1">
                &ldquo;समृद्ध तिरहुत, पारदर्शी प्रशासन&rdquo;
              </p>
            </div>
          </nav>

          {/* MAIN WORKING SURFACE AREA */}
          <section className="lg:col-span-9 space-y-8">
            
            {/* VIEW 1: COMMAND CENTER / ANALYTICS */}
            {currentView === "analytics" && (
              <div className="space-y-8 animate-fade-in">
                {/* Visual Map and Headline */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  {/* Clickable GIS Map */}
                  <div className="xl:col-span-7">
                    <TirhutMap
                      submissions={submissions}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      onDistrictSelect={(dist) => {
                        setSelectedDistrict(dist);
                        appendAuditLog("Anchor Map Unit", `Anchored map reviews and indicators to ${dist}`);
                      }}
                      selectedDistrict={selectedDistrict}
                    />
                  </div>

                  {/* Summary Indicators sidebar panel */}
                  <div className={`xl:col-span-5 border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800 shadow-sm"
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Landmark className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`} />
                        <h3 className={`font-sans font-bold text-sm ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                          Executive indicators summaries
                        </h3>
                      </div>
                      <p className={`text-[10px] font-mono mb-6 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Anchored Period: {selectedMonth} {selectedYear} | Focus Area: {selectedDistrict}
                      </p>

                      <div className="space-y-4">
                        <div className={`flex justify-between items-center p-3 rounded-2xl border ${
                          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                        }`}>
                          <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Total Program Allocation</span>
                          <span className={`font-mono text-xs font-bold ${isDarkMode ? "text-amber-500" : "text-blue-700"}`}>
                            ₹{(submissions.filter((s) => selectedDistrict === "All Tirhut Division" ? s.month === selectedMonth && s.year === selectedYear : s.district === selectedDistrict && s.month === selectedMonth && s.year === selectedYear).reduce((sum, r) => sum + r.totalAllocation, 0) / 10000000).toFixed(2)} Cr
                          </span>
                        </div>

                        <div className={`flex justify-between items-center p-3 rounded-2xl border ${
                          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                        }`}>
                          <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Expenditure Incurred</span>
                          <span className={`font-mono text-xs ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            ₹{(submissions.filter((s) => selectedDistrict === "All Tirhut Division" ? s.month === selectedMonth && s.year === selectedYear : s.district === selectedDistrict && s.month === selectedMonth && s.year === selectedYear).reduce((sum, r) => sum + r.cumulativeExpenditure, 0) / 10000000).toFixed(2)} Cr
                          </span>
                        </div>

                        <div className={`flex justify-between items-center p-3 rounded-2xl border ${
                          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                        }`}>
                          <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Total Active Beneficiaries</span>
                          <span className={`font-mono text-xs font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                            {submissions.filter((s) => selectedDistrict === "All Tirhut Division" ? s.month === selectedMonth && s.year === selectedYear : s.district === selectedDistrict && s.month === selectedMonth && s.year === selectedYear).reduce((sum, r) => sum + r.coveredBeneficiaries, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`border-t pt-4 text-[10px] font-mono ${isDarkMode ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                      <span>Authority authorization: Commissioner Office, Tirhut division, Muzaffarpur.</span>
                    </div>
                  </div>
                </div>

                {/* KPI Charts Dashboard Area */}
                <TirhutCharts
                  submissions={submissions}
                  schemes={schemes}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              </div>
            )}

            {/* VIEW 2: SCHEME PROGRESS DATA ENTRY */}
            {currentView === "entry" && (session.role === "District Officer" || session.role === "Commissioner Office" || session.role === "Admin") && (
              <div className="animate-fade-in">
                <SchemeForm
                  schemes={schemes}
                  activeDistrict={selectedDistrict === "All Tirhut Division" ? "Muzaffarpur" : selectedDistrict}
                  allSubmissions={submissions}
                  onSaveSubmission={handleSaveProgress}
                  onDeleteSubmission={handleDeleteProgress}
                  currentUser={session.role === "District Officer" ? `${session.district} Officer` : "Commissioner Office"}
                  isCommissionerOrAdmin={session.role !== "District Officer"}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

            {/* VIEW 3: DYNAMIC SCHEMES BUILDER (Admin only) */}
            {currentView === "schemes" && session.role === "Admin" && (
              <div className="animate-fade-in">
                <DynamicSchemeManager 
                  schemes={schemes} 
                  onAddScheme={handleAddScheme} 
                  onDeleteScheme={handleDeleteScheme} 
                />
              </div>
            )}

            {/* VIEW 4: SYSTEM INTEGRITY AUDIT TRAILS */}
            {currentView === "audit" && (
              <div className={`border rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in transition-all ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800 shadow-sm"
              }`}>
                <div>
                  <h3 className={`font-sans font-bold text-lg flex items-center gap-2 ${
                    isDarkMode ? "text-slate-100" : "text-slate-900"
                  }`}>
                    <ShieldCheck className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`} />
                    <span>Administrative Integrity Audit Trails</span>
                  </h3>
                  <p className={`text-xs font-mono ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Official timestamp registry of full system queries, updates, deletes, and policy summary generations for oversight check.
                  </p>
                </div>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className={`border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200/60 text-slate-700"
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                            isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"
                          }`}>
                            {log.action}
                          </span>
                          <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>{log.username}</span>
                          <span className="text-[10px] text-slate-400 font-mono">IP: {log.ipAddress}</span>
                        </div>
                        <p className={`font-sans ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{log.details}</p>
                      </div>

                      <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 5: DISTRICT COMPARISON OVERLAY VIEW */}
            {currentView === "comparison" && (session.role === "Commissioner Office" || session.role === "Admin") && (
              <DistrictComparison
                submissions={submissions}
                schemes={schemes}
                globalMonth={selectedMonth}
                globalYear={selectedYear}
                isDarkMode={isDarkMode}
              />
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
