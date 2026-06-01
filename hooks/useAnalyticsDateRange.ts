"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LinkClick } from "@/lib/supabase";
import {
  getTodayDateString,
  resolveDateRangePreset,
  type DateRangePreset,
} from "@/lib/analytics-date-range";

const DEFAULT_PRESET: DateRangePreset = "all_time";

type StoredDateRange = {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
};

const VALID_PRESETS = new Set<DateRangePreset>([
  "all_time",
  "this_month",
  "this_week",
  "yesterday",
  "today",
  "last_month",
  "last_3_months",
  "ytd",
  "custom",
]);

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function readStoredDateRange(storageKey: string): StoredDateRange | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDateRange>;
    if (!parsed.preset || !VALID_PRESETS.has(parsed.preset)) return null;
    if (!isValidDateString(parsed.startDate) || !isValidDateString(parsed.endDate)) {
      return null;
    }
    return {
      preset: parsed.preset,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    };
  } catch {
    return null;
  }
}

function writeStoredDateRange(storageKey: string, value: StoredDateRange) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // ignore quota / private mode errors
  }
}

export const ANALYTICS_DATE_RANGE_STORAGE_KEYS = {
  brand: "linkto:analytics-date-range:brand",
  project: "linkto:analytics-date-range:project",
} as const;

export function useAnalyticsDateRange(
  storageKey: string,
  clicks: LinkClick[]
) {
  const today = getTodayDateString();
  const [rangePreset, setRangePreset] =
    useState<DateRangePreset>(DEFAULT_PRESET);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [hydrated, setHydrated] = useState(false);

  const allTimeRange = useMemo(
    () => resolveDateRangePreset("all_time", clicks),
    [clicks]
  );

  useEffect(() => {
    const stored = readStoredDateRange(storageKey);
    if (stored) {
      setRangePreset(stored.preset);
      setStartDate(stored.startDate);
      setEndDate(stored.endDate);
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    if (rangePreset === "custom") return;
    const range = resolveDateRangePreset(rangePreset, clicks);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }, [hydrated, rangePreset, clicks]);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredDateRange(storageKey, {
      preset: rangePreset,
      startDate,
      endDate,
    });
  }, [hydrated, storageKey, rangePreset, startDate, endDate]);

  const applyPreset = useCallback(
    (preset: DateRangePreset) => {
      setRangePreset(preset);
      if (preset === "custom") return;
      const range = resolveDateRangePreset(preset, clicks);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    },
    [clicks]
  );

  const handleStartDateChange = useCallback((date: string) => {
    setRangePreset("custom");
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date: string) => {
    setRangePreset("custom");
    setEndDate(date);
  }, []);

  return {
    rangePreset,
    startDate,
    endDate,
    allTimeRange,
    applyPreset,
    handleStartDateChange,
    handleEndDateChange,
  };
}
