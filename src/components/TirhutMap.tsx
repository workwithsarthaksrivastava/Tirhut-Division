import React, { useState } from "react";
import { MonthlyProgress } from "../types";
import { MapPin, Globe, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface TirhutMapProps {
  submissions: MonthlyProgress[];
  selectedMonth: string;
  selectedYear: string;
  onDistrictSelect: (district: string) => void;
  selectedDistrict: string;
}

interface DistrictGeo {
  id: string;
  name: string;
  path: string;
  textX: number;
  textY: number;
}

// Geometric coordinates representing Tirhut Division's 6 districts in an interlocking layout (viewBox 0 0 500 450)
const DISTRICT_GEOMETRIES: DistrictGeo[] = [
  {
    id: "West Champaran",
    name: "West Champaran",
    path: "M 20,40 L 170,30 L 150,110 L 100,160 L 30,120 Z",
    textX: 85,
    textY: 85,
  },
  {
    id: "East Champaran",
    name: "East Champaran",
    path: "M 170,30 L 270,50 L 250,130 L 180,150 L 150,110 Z",
    textX: 205,
    textY: 95,
  },
  {
    id: "Sitamarhi",
    name: "Sitamarhi",
    path: "M 270,50 L 390,40 L 380,120 L 290,150 L 250,130 Z",
    textX: 325,
    textY: 95,
  },
  {
    id: "Sheohar",
    name: "Sheohar",
    path: "M 245,120 L 285,120 L 270,165 Z", // Squeezed in between
    textX: 268,
    textY: 140,
  },
  {
    id: "Muzaffarpur",
    name: "Muzaffarpur",
    path: "M 100,160 L 290,150 L 310,270 L 170,270 L 120,215 Z",
    textX: 195,
    textY: 205,
  },
  {
    id: "Vaishali",
    name: "Vaishali",
    path: "M 170,270 L 310,270 L 280,360 L 190,360 Z",
    textX: 235,
    textY: 315,
  },
];

export default function TirhutMap({
  submissions,
  selectedMonth,
  selectedYear,
  onDistrictSelect,
  selectedDistrict,
}: TirhutMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  // Calculate statistics for each district in the selected period
  const getDistrictStats = (districtName: string) => {
    const records = submissions.filter(
      (s) => s.district === districtName && s.month === selectedMonth && s.year === selectedYear && s.status === "Approved"
    );

    if (records.length === 0) {
      // Look for any status to give partial indicator
      const anyRecords = submissions.filter(
        (s) => s.district === districtName && s.month === selectedMonth && s.year === selectedYear
      );
      if (anyRecords.length > 0) {
        return {
          hasData: true,
          status: anyRecords[0].status,
          avgUtilization: anyRecords.reduce((acc, r) => acc + r.utilizationPercentage, 0) / anyRecords.length,
          totalBudget: anyRecords.reduce((acc, r) => acc + r.totalAllocation, 0),
          beneficiaries: anyRecords.reduce((acc, r) => acc + r.coveredBeneficiaries, 0),
        };
      }
      return { hasData: false, status: "No Submission", avgUtilization: 0, totalBudget: 0, beneficiaries: 0 };
    }

    const totalBudget = records.reduce((acc, r) => acc + r.totalAllocation, 0);
    const totalExp = records.reduce((acc, r) => acc + r.cumulativeExpenditure, 0);
    const avgUtilization = totalBudget > 0 ? (totalExp / totalBudget) * 100 : 0;
    const beneficiaries = records.reduce((acc, r) => acc + r.coveredBeneficiaries, 0);

    return {
      hasData: true,
      status: "Approved" as const,
      avgUtilization,
      totalBudget,
      beneficiaries,
    };
  };

  // Determine district visual coloration depending on its Utilization Rate using regional theme colors
  const getDistrictColor = (districtName: string, isSelected: boolean) => {
    const stats = getDistrictStats(districtName);

    if (!stats.hasData) {
      return isSelected 
        ? "fill-[#2B1D1D] stroke-marigold-gold stroke-[2.5]" 
        : "fill-cultural-darker stroke-saffron/20 hover:fill-cultural-card-dark/70";
    }

    const utilization = stats.avgUtilization;

    if (stats.status === "Rejected") {
      return isSelected 
        ? "fill-crimson-dark stroke-marigold-gold stroke-[2.5]" 
        : "fill-[#451C1C] stroke-crimson-sindoor hover:fill-crimson-dark";
    }

    if (utilization >= 85) {
      return isSelected
        ? "fill-[#1E4D2B] stroke-marigold-gold stroke-[3.5] filter drop-shadow-md"
        : "fill-[#22543D] stroke-[#48BB78] hover:fill-[#2F855A]";
    } else if (utilization >= 60) {
      return isSelected
        ? "fill-saffron stroke-marigold-gold stroke-[3.5] filter drop-shadow-md"
        : "fill-[#C05621] stroke-saffron hover:fill-[#DD6B20]";
    } else {
      return isSelected
        ? "fill-[#7B1F1F] stroke-marigold-gold stroke-[3.5] filter drop-shadow-md"
        : "fill-crimson-dark stroke-crimson-sindoor hover:fill-[#9B2C2C]";
    }
  };

  const activeHoverData = hoveredDistrict ? getDistrictStats(hoveredDistrict) : null;

  return (
    <div className="relative bg-cultural-card-dark border border-saffron/20 rounded-3xl p-6 shadow-2xl overflow-hidden min-h-[460px] flex flex-col justify-between transition-colors">
      {/* Dynamic Saffron/Marigold Header border representing Mithila Madhubani art alignment */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-crimson-sindoor to-marigold-gold opacity-80" />
      
      {/* Headline Header Info */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-saffron animate-pulse" />
          <h3 className="font-serif font-bold text-lg text-ivory-cream tracking-tight">
            Tirhut Geographical Command Center
          </h3>
        </div>
        <p className="text-xs text-ivory-cream/60 font-mono">
          Click district segment to anchor deep metrics review. Color codes reflect Fund Utilization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-4">
        {/* SVG Drawing Zone */}
        <div className="lg:col-span-8 flex justify-center relative">
          <svg
            viewBox="0 0 440 400"
            className="w-full max-w-[340px] md:max-w-[390px] drop-shadow-[0_0_25px_rgba(235,140,80,0.15)] filter"
          >
            {DISTRICT_GEOMETRIES.map((dist) => {
              const isSelected = selectedDistrict === dist.name;
              return (
                <g key={dist.id} className="cursor-pointer">
                  {/* Glowing district vector path */}
                  <path
                    d={dist.path}
                    className={`transition-all duration-300 ${getDistrictColor(dist.name, isSelected)}`}
                    onClick={() => onDistrictSelect(dist.name)}
                    onMouseEnter={() => setHoveredDistrict(dist.name)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* High visual map label text */}
                  <text
                    x={dist.textX}
                    y={dist.textY}
                    className="font-serif text-[10px] font-bold fill-ivory-cream select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center tracking-tight"
                    textAnchor="middle"
                  >
                    {dist.name === "West Champaran"
                      ? "W. Champaran"
                      : dist.name === "East Champaran"
                      ? "E. Champaran"
                      : dist.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Absolute Mini Legend Grid Overlay */}
          <div className="absolute bottom-2 left-2 bg-cultural-darker/90 backdrop-blur-md rounded-xl p-2 border border-saffron/20 text-[10px] font-mono flex flex-col gap-1 gap-y-1.5 shadow-xl">
            <div className="flex items-center gap-1.5 text-ivory-cream/90">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F855A] inline-block border border-[#48BB78] shadow-[0_0_8px_rgba(72,187,120,0.6)]" />
              <span>Optimal Progress (&ge;85%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-saffron">
              <span className="w-2.5 h-2.5 rounded-full bg-saffron inline-block border border-marigold-gold shadow-[0_0_8px_rgba(240,140,60,0.6)]" />
              <span>Moderate Review (60% - 84%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-crimson-sindoor">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9B2C2C] inline-block border border-crimson-sindoor shadow-[0_0_8px_rgba(220,53,69,0.6)]" />
              <span>Critical Deficit (&lt;60%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-ivory-cream/55">
              <span className="w-2.5 h-2.5 rounded-full bg-cultural-darker inline-block border border-saffron/10" />
              <span>No Active Period Record</span>
            </div>
          </div>
        </div>

        {/* Dynamic Context Tooltip Details Sidebar Panel */}
        <div className="lg:col-span-4 bg-cultural-darker/50 rounded-2xl p-4 border border-saffron/20 flex flex-col justify-center min-h-[180px] transition-all duration-300">
          {hoveredDistrict || selectedDistrict ? (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-saffron/10">
                <MapPin className="w-4 h-4 text-crimson-sindoor animate-bounce" />
                <h4 className="font-serif font-bold text-ivory-cream text-sm">
                  {hoveredDistrict || selectedDistrict}
                </h4>
                <span className="text-[10px] bg-cultural-card-dark px-2 py-0.5 rounded text-marigold-gold font-mono uppercase tracking-widest border border-saffron/15">
                  {hoveredDistrict ? "Hovered" : "Anchored"}
                </span>
              </div>

              {hoveredDistrict ? (
                // Stats output for hovered district
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-ivory-cream/60 font-medium">Reporting Status:</span>
                    <span
                      className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                        activeHoverData?.status === "Approved"
                          ? "bg-[#1E4D2B]/40 text-[#48BB78] border border-[#22543D]"
                          : activeHoverData?.status === "Under Review"
                          ? "bg-saffron/20 text-marigold-gold border border-saffron/30"
                          : activeHoverData?.status === "Rejected"
                          ? "bg-[#7B1F1F]/40 text-crimson-sindoor border border-crimson-dark"
                          : "bg-cultural-card-dark text-ivory-cream/40"
                      }`}
                    >
                      {activeHoverData?.status || "Unfilled"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-ivory-cream/60">Avg Fund Util:</span>
                    <span className="font-mono text-ivory-cream font-bold">
                      {activeHoverData?.hasData ? `${activeHoverData.avgUtilization.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>

                  {activeHoverData?.hasData && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-ivory-cream/60">Total Budget:</span>
                        <span className="font-mono text-marigold-gold font-bold">
                          ₹{(activeHoverData.totalBudget / 10000000).toFixed(2)} Cr
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ivory-cream/60">Beneficiaries:</span>
                        <span className="font-mono text-ivory-cream">
                          {activeHoverData.beneficiaries.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Show currently anchored selected district metrics
                <div className="space-y-2.5 text-xs">
                  {getDistrictStats(selectedDistrict).hasData ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-ivory-cream/60 font-medium">Period Reports:</span>
                        <span className="font-mono text-[#48BB78] font-bold">
                          DATA REGISTERED
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ivory-cream/60">District Avg Util:</span>
                        <span className="font-mono text-marigold-gold font-semibold">
                          {getDistrictStats(selectedDistrict).avgUtilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ivory-cream/60">Selected Month:</span>
                        <span className="font-mono text-ivory-cream/90">{selectedMonth}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-ivory-cream/60 italic text-center py-2">
                      No approved reports generated for this district in {selectedMonth} {selectedYear}. Select Data Entry to submit.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-ivory-cream/40 space-y-2">
              <AlertTriangle className="w-6 h-6 mx-auto text-saffron/60" />
              <p className="text-xs font-serif">
                No district hovered. Hover maps segments or select from dropdown list.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
