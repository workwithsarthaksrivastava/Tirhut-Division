import React, { useState } from "react";
import { UserSession } from "../types";
import { Lock, Eye, EyeOff, LayoutDashboard, ShieldCheck, Landmark } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [role, setRole] = useState<UserSession["role"]>("District Officer");
  const [district, setDistrict] = useState<string>("Muzaffarpur");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const districts = [
    "Muzaffarpur",
    "Sitamarhi",
    "Sheohar",
    "East Champaran",
    "West Champaran",
    "Vaishali",
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedPass = password.trim();
    if (!trimmedPass) {
      setErrorMsg("Security passcode cannot be left blank.");
      return;
    }

    if (role === "Admin" && trimmedPass !== "admin@tirhut") {
      setErrorMsg("Unauthorized: Invalid Admin access credentials.");
      return;
    }

    if (role === "Commissioner Office" && trimmedPass !== "commissioner@tirhut") {
      setErrorMsg("Unauthorized: Invalid Commissioner Office credentials.");
      return;
    }

    if (role === "District Officer" && trimmedPass !== "officer@tirhut") {
      setErrorMsg("Unauthorized: Invalid District Representative credentials.");
      return;
    }

    // Pass valid session up to parent state
    onLoginSuccess({
      district: role === "District Officer" ? district : "All Tirhut Division",
      role,
      isLoggedIn: true,
    });
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-4 overflow-hidden">
      {/* Terracotta/Saffron light glow backdrops representing Mithila sun/fire element */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-saffron/20 via-terracotta/10 to-transparent blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-marigold-gold/20 via-terracotta/10 to-transparent blur-3xl -z-10" />

      <div className="w-full max-w-5xl bg-cultural-card-dark/95 border-2 border-saffron rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl backdrop-blur-xl border-madhubani-dual">
        {/* Left cultural showcase hero banner */}
        <div className="p-8 bg-gradient-to-br from-cultural-darker via-cultural-dark to-cultural-darker flex flex-col justify-between border-b md:border-b-0 md:border-r border-saffron/40 relative">
          
          {/* Saffron & Crimson border lines representing Mithila Border alignment */}
          <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-saffron via-crimson-sindoor to-marigold-gold" />

          <div className="pl-4">
            <div className="flex items-center gap-2 text-saffron font-mono text-xs tracking-widest font-bold mb-4 uppercase">
              <Landmark className="w-4 h-4 text-marigold-gold" />
              <span>Govt of Bihar Initiative</span>
            </div>
            
            <h1 className="font-serif font-bold text-ivory-cream text-3xl md:text-4xl tracking-tight leading-none mb-1">
              TISMAP
            </h1>
            <h2 className="font-sans font-medium text-saffron text-[10.5px] tracking-wider uppercase mb-6 leading-relaxed">
              Tirhut Integrated Scheme Monitoring, Analytics & Planning Portal
            </h2>

            <p className="text-xs text-ivory-cream/80 leading-relaxed font-sans max-w-sm mb-6">
              Official administrative monitoring network enabling transparent performance tracking, budget audits, and direct evaluation workflows for commissioner and district units.
            </p>

            <div className="border-t border-saffron/20 pt-4 mt-4">
              <p className="text-[10px] text-marigold-gold font-mono uppercase tracking-wider mb-2">
                Administrative Directives / Roles:
              </p>
              <ul className="space-y-1.5 text-[11px] text-ivory-cream/70 font-sans list-disc list-inside">
                <li><strong>District Officer:</strong> Handles dedicated Scheme Data Entry.</li>
                <li><strong>Commissioner Office:</strong> Monitored District Comparison overlays.</li>
                <li><strong>Admin Level:</strong> Full unified scope across all systems & builders.</li>
                <li>System logs recording active administrative IP.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right authentic security input card form */}
        <div className="p-8 flex flex-col justify-center bg-cultural-dark/60">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-saffron">
                Administrative Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["District Officer", "Commissioner Office", "Admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setErrorMsg("");
                    }}
                    className={`text-[10px] font-mono py-2.5 px-1 rounded-xl border transition-all uppercase tracking-normal cursor-pointer ${
                      role === r
                        ? "bg-gradient-to-r from-saffron to-crimson-sindoor text-white border-saffron-light font-bold shadow-md"
                        : "bg-cultural-darker text-ivory-cream/60 border-saffron/20 hover:text-ivory-cream hover:border-saffron/50"
                    }`}
                  >
                    {r.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {role === "District Officer" && (
              <div className="space-y-1.5 transition-all">
                <label className="text-[11px] font-mono uppercase tracking-widest text-saffron">
                  Select Reporting District Unit
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-cultural-darker border border-saffron/30 rounded-2xl p-3 text-xs text-ivory-cream outline-none focus:border-saffron transition-colors"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-saffron">
                Administrative Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-saffron/50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    role === "Admin"
                      ? "Enter Admin key"
                      : role === "Commissioner Office"
                      ? "Enter Commissioner key"
                      : "Enter District key"
                  }
                  className="w-full bg-cultural-darker border border-saffron/30 rounded-2xl py-3 pl-10 pr-10 text-xs text-ivory-cream outline-none focus:border-saffron transition-colors placeholder:text-ivory-cream/30 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-saffron/50 hover:text-saffron cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="bg-crimson-dark/80 text-rose-300 border border-crimson-sindoor p-3 rounded-2xl text-[11px] font-mono leading-relaxed">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-saffron to-crimson-sindoor hover:from-saffron-light hover:to-saffron text-white font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-saffron/30"
            >
              <ShieldCheck className="w-4 h-4 text-marigold-gold" />
              <span>Verify and Establish Session</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
