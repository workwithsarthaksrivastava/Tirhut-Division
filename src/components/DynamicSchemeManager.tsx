import React, { useState } from "react";
import { Scheme } from "../types";
import { Plus, ListCollapse, BookOpen, Layers, ShieldAlert, CheckCircle, Trash2, AlertCircle } from "lucide-react";

interface DynamicSchemeManagerProps {
  schemes: Scheme[];
  onAddScheme: (newScheme: Scheme) => void;
  onDeleteScheme?: (id: string, name: string) => void;
}

export default function DynamicSchemeManager({ schemes, onAddScheme, onDeleteScheme }: DynamicSchemeManagerProps) {
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [category, setCategory] = useState<Scheme["category"]>("Rural Development");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<Scheme["reportingFrequency"]>("Monthly");
  
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [confirmDeleteScheme, setConfirmDeleteScheme] = useState<Scheme | null>(null);

  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !code.trim() || !department.trim()) {
      setErrorMsg("Please fill out Scheme Name, Scheme Code, and Department.");
      return;
    }

    // Verify code uniqueness
    const codeExists = schemes.some((s) => s.code.toLowerCase() === code.trim().toLowerCase());
    if (codeExists) {
      setErrorMsg(`A scheme with code '${code}' already exists in registry.`);
      return;
    }

    const newScheme: Scheme = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      department: department.trim(),
      category,
      description: description.trim(),
      reportingFrequency: frequency,
    };

    onAddScheme(newScheme);
    setSuccessMsg(`Scheme '${newScheme.name}' successfully cataloged. Ready in dropdown select.`);
    
    // Clear Form
    setName("");
    setCode("");
    setDepartment("");
    setDescription("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Dynamic Creation Form */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
        <div>
          <h2 className="font-sans font-semibold text-slate-100 text-lg flex items-center gap-2">
            <Plus className="text-amber-500 w-5 h-5" />
            <span>Onboard New Scheme Registry</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Define new government initiatives dynamically. These will generate data entry parameters instantly.
          </p>
        </div>

        <form onSubmit={handleCreateScheme} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400">Scheme Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Mukhyamantri Balika Cycle Yojana"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors placeholder:text-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400">Scheme Unique Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="E.g. SCH-MBCY"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors placeholder:text-slate-700 font-mono text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400">Nodal Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="E.g. Social Welfare Department"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors placeholder:text-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400">Scheme Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
              >
                {["Rural Development", "Health", "Education", "Infrastructure", "Water & Sanitation", "Social Welfare", "Other"].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400">Brief Overview / Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State target guidelines, funding criteria, and administrative scopes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors placeholder:text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400">Reporting Return Intervals</label>
            <div className="flex gap-4">
              {(["Monthly", "Quarterly", "Yearly"] as const).map((fr) => (
                <label key={fr} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="radio"
                    name="freq"
                    checked={frequency === fr}
                    onChange={() => setFrequency(fr)}
                    className="accent-amber-500"
                  />
                  <span>{fr} Progress Report</span>
                </label>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="bg-rose-950/40 border border-rose-900/40 p-3 rounded-2xl text-[11px] font-mono text-rose-400">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-2xl text-[11px] font-mono text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {successMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(217,119,6,0.15)] cursor-pointer"
          >
            Acknowledge and Create Scheme Definition
          </button>
        </form>
      </div>

      {/* Existing Catalog List view */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="text-amber-500 w-5 h-5" />
            <h3 className="font-sans font-bold text-slate-100 text-sm">Active Scheme Catalog ({schemes.length})</h3>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2">
            {schemes.map((s) => (
              <div key={s.id} className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-900 border border-slate-800/80 text-amber-500 text-xs font-mono font-bold w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    SCH
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-sans font-bold text-slate-200 text-xs">{s.name.split(" (")[0]}</span>
                      <span className="text-[9px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.2 font-mono text-slate-400 uppercase">
                        {s.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono tracking-tight leading-normal">
                      Nodal: {s.department}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-2 pr-1">{s.description}</p>
                  </div>
                </div>

                {onDeleteScheme && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteScheme(s)}
                    title="Deregister Scheme"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4 flex items-start gap-2.5 bg-slate-950/30 rounded-2xl p-3 border border-slate-800/40 text-[10px] font-mono text-slate-500">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Schemes registered from this console will be propagated instantly to all six district subunits' data entry dropdown menu options.
          </span>
        </div>
      </div>

      {/* Sleek Modal Dialogue overlay for confirming dynamic scheme deletion */}
      {confirmDeleteScheme && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-100">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-950/50 rounded-xl border border-rose-800">
                <AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-150 font-sans tracking-wide">
                  Confirm Scheme Decommissioning
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Code Reference: {confirmDeleteScheme.code}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-2">
              <p>
                Are you sure you want to delete the scheme <strong>"{confirmDeleteScheme.name}"</strong>?
              </p>
              <p className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 font-mono leading-normal">
                ❗ <strong>Warning:</strong> Deleting this template removes its structure from dropdowns and report matrices immediately. Historical metrics for this scheme may not compile correctly without their registered catalog template definitions.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteScheme(null)}
                className="px-4 py-2 text-[11px] font-sans font-bold uppercase tracking-wider bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Keep Scheme
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteScheme) {
                    onDeleteScheme(confirmDeleteScheme.id, confirmDeleteScheme.name);
                  }
                  setConfirmDeleteScheme(null);
                }}
                className="px-4 py-2 text-[11px] font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
