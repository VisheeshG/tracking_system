"use client";

import { useState } from "react";
import { URL_SEGMENTS } from "./landing-data";

export function BrandedUrlDemo() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="mt-10 max-w-3xl mx-auto">
      <p className="text-center text-xs text-slate-500 mb-3 font-medium">
        Hover each segment to see what it tracks
      </p>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 font-mono text-sm sm:text-base text-center flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
        <span className="text-slate-500">linkto.in/</span>
        {URL_SEGMENTS.map((seg, i) => (
          <span key={seg.key} className="inline-flex items-center">
            <button
              type="button"
              onMouseEnter={() => setActive(seg.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(seg.key)}
              onBlur={() => setActive(null)}
              className={`rounded-md px-1.5 py-0.5 transition-all duration-200 ${
                active === seg.key
                  ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50 scale-105"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {seg.value}
            </button>
            {i < URL_SEGMENTS.length - 1 && (
              <span className="text-slate-600 mx-0.5">/</span>
            )}
          </span>
        ))}
      </div>
      <p
        className={`text-center text-sm mt-3 min-h-[1.25rem] transition-opacity duration-200 ${
          active ? "text-cyan-300 opacity-100" : "text-slate-600 opacity-0"
        }`}
      >
        {URL_SEGMENTS.find((s) => s.key === active)?.hint ?? "\u00a0"}
      </p>
    </div>
  );
}
