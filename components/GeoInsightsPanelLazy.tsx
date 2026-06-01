"use client";

import dynamic from "next/dynamic";
import type { LinkClick } from "@/lib/supabase";

export const GeoInsightsPanelLazy = dynamic(
  () =>
    import("./GeoInsightsPanel").then((mod) => ({
      default: mod.GeoInsightsPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-6 sm:mb-8">
        <p className="text-sm text-slate-500 text-center">
          Loading geographic insights…
        </p>
      </div>
    ),
  }
);

export function GeoInsightsPanelClient({
  clicks,
}: {
  clicks: LinkClick[];
}) {
  return <GeoInsightsPanelLazy clicks={clicks} />;
}
