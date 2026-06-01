"use client";

import { CREATOR_ROWS } from "./landing-data";
import { Globe, Monitor, Smartphone, TrendingUp } from "lucide-react";

const TOP_LOCATIONS = [
  { name: "United States", pct: 38 },
  { name: "India", pct: 24 },
  { name: "United Kingdom", pct: 12 },
];

export function HeroDashboard() {
  return (
    <div className="relative w-full max-w-2xl mx-auto landing-dashboard-glow">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/40 via-blue-500/20 to-violet-500/30 blur-sm" />
      <div className="relative rounded-2xl border border-white/10 bg-[#12121a]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs text-slate-500 font-mono">
            linkto — live analytics
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Creator links
            </p>
            <ul className="space-y-3">
              {CREATOR_ROWS.map((row, i) => (
                <li
                  key={row.handle}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 landing-stagger"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {row.handle}
                    </p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-cyan-300 tabular-nums shrink-0">
                    {row.clicks.toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Real-time analytics
              </p>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon: TrendingUp, label: "Top creators", active: true },
                { icon: Globe, label: "Locations" },
                { icon: Smartphone, label: "Devices" },
                { icon: Monitor, label: "Campaigns" },
              ].map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`rounded-lg px-2.5 py-2 border text-[10px] font-medium ${
                    active
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                      : "border-white/10 bg-white/[0.03] text-slate-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 mb-1 opacity-80" />
                  {label}
                </div>
              ))}
            </div>

            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              Top locations
            </p>
            <ul className="space-y-2">
              {TOP_LOCATIONS.map((loc) => (
                <li
                  key={loc.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300">{loc.name}</span>
                  <span className="text-slate-500 tabular-nums">{loc.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
