"use client";

import {
  DATE_RANGE_PRESET_OPTIONS,
  type DateRangePreset,
} from "@/lib/analytics-date-range";

interface AnalyticsDateRangePickerProps {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  maxDate?: string;
  minDate?: string;
}

export function AnalyticsDateRangePicker({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  maxDate,
  minDate,
}: AnalyticsDateRangePickerProps) {
  const todayMax = maxDate ?? new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {DATE_RANGE_PRESET_OPTIONS.map(({ id, label }) => {
          const active = preset === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPresetChange(id)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {preset === "custom" && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              min={minDate}
              max={endDate || todayMax}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none bg-white"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || minDate}
              max={todayMax}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
