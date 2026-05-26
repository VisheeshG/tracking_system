"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, LinkClick, supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MousePointerClick,
  Monitor,
  Users,
  Eye,
  X,
  Filter,
} from "lucide-react";
import { ClicksAnalyticsChart } from "./ClicksAnalyticsChart";

const FILTER_ALL = "all";

type ClickFilters = {
  submission: string;
  country: string;
  city: string;
  device: string;
  browser: string;
};

const DEFAULT_CLICK_FILTERS: ClickFilters = {
  submission: FILTER_ALL,
  country: FILTER_ALL,
  city: FILTER_ALL,
  device: FILTER_ALL,
  browser: FILTER_ALL,
};

function sortSubmissionValues(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const aIsNumeric = !isNaN(Number(a));
    const bIsNumeric = !isNaN(Number(b));
    if (aIsNumeric && bIsNumeric) return Number(a) - Number(b);
    if (aIsNumeric) return -1;
    if (bIsNumeric) return 1;
    return a.localeCompare(b);
  });
}

function matchesClickFilters(click: LinkClick, filters: ClickFilters): boolean {
  if (
    filters.submission !== FILTER_ALL &&
    (click.submission_number ?? "") !== filters.submission
  ) {
    return false;
  }
  if (filters.country !== FILTER_ALL && click.country !== filters.country) {
    return false;
  }
  if (filters.city !== FILTER_ALL && click.city !== filters.city) {
    return false;
  }
  if (
    filters.device !== FILTER_ALL &&
    click.device_type !== filters.device
  ) {
    return false;
  }
  if (filters.browser !== FILTER_ALL && click.browser !== filters.browser) {
    return false;
  }
  return true;
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function computeAnalyticsFromClicks(
  clicks: LinkClick[],
  link: Link,
  startDate: string,
  endDate: string
): AnalyticsData {
  const analyticsData: AnalyticsData = {
    totalClicks: clicks.length,
    clicksByLinkTitle: {},
    clicksByCreator: {},
    clicksBySubmission: {},
    clicksByCountry: {},
    clicksByCity: {},
    clicksByDevice: {},
    clicksByBrowser: {},
    clicksByWeek: [],
    filteredClicks: clicks,
  };

  const dailyClicksMap: Record<string, number> = {};

  clicks.forEach((click) => {
    const linkTitle = link.link_title;
    analyticsData.clicksByLinkTitle[linkTitle] =
      (analyticsData.clicksByLinkTitle[linkTitle] || 0) + 1;

    if (click.creator_username) {
      analyticsData.clicksByCreator[click.creator_username] =
        (analyticsData.clicksByCreator[click.creator_username] || 0) + 1;
    }

    if (click.submission_number) {
      analyticsData.clicksBySubmission[click.submission_number] =
        (analyticsData.clicksBySubmission[click.submission_number] || 0) + 1;
    }

    if (click.country) {
      analyticsData.clicksByCountry[click.country] =
        (analyticsData.clicksByCountry[click.country] || 0) + 1;
    }

    if (click.city) {
      analyticsData.clicksByCity[click.city] =
        (analyticsData.clicksByCity[click.city] || 0) + 1;
    }

    if (click.device_type) {
      analyticsData.clicksByDevice[click.device_type] =
        (analyticsData.clicksByDevice[click.device_type] || 0) + 1;
    }

    if (click.browser) {
      analyticsData.clicksByBrowser[click.browser] =
        (analyticsData.clicksByBrowser[click.browser] || 0) + 1;
    }

    if (click.clicked_at) {
      const dateString = getDateString(new Date(click.clicked_at));
      if (dateString >= startDate && dateString <= endDate) {
        dailyClicksMap[dateString] = (dailyClicksMap[dateString] || 0) + 1;
      }
    }
  });

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const rangeDays = [];
  for (let i = 0; i < daysDiff; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    const dateString = getDateString(dayDate);
    rangeDays.push({
      week: formatDateForDisplay(dayDate),
      clicks: dailyClicksMap[dateString] || 0,
    });
  }

  analyticsData.clicksByWeek = rangeDays;
  return analyticsData;
}

function extractFilterOptions(
  clicks: LinkClick[],
  countryFilter: string
): {
  submissions: string[];
  countries: string[];
  cities: string[];
  devices: string[];
  browsers: string[];
} {
  const submissions = new Set<string>();
  const countries = new Set<string>();
  const cities = new Set<string>();
  const devices = new Set<string>();
  const browsers = new Set<string>();

  clicks.forEach((click) => {
    if (click.submission_number) submissions.add(click.submission_number);
    if (click.country) countries.add(click.country);
    if (
      click.city &&
      (countryFilter === FILTER_ALL || click.country === countryFilter)
    ) {
      cities.add(click.city);
    }
    if (click.device_type) devices.add(click.device_type);
    if (click.browser) browsers.add(click.browser);
  });

  return {
    submissions: sortSubmissionValues([...submissions]),
    countries: [...countries].sort((a, b) => a.localeCompare(b)),
    cities: [...cities].sort((a, b) => a.localeCompare(b)),
    devices: [...devices].sort((a, b) => a.localeCompare(b)),
    browsers: [...browsers].sort((a, b) => a.localeCompare(b)),
  };
}

function hasActiveFilters(filters: ClickFilters): boolean {
  return Object.values(filters).some((v) => v !== FILTER_ALL);
}

type CreatorTableSortColumn =
  | "lastClick"
  | "creator"
  | "totalClicks"
  | "totalSubmissions";
type SortDirection = "asc" | "desc";

type CreatorTableRow = {
  username: string;
  totalClicks: number;
  lastClick: string;
  submissions: Set<string>;
};

function buildCreatorRows(clicks: LinkClick[]): CreatorTableRow[] {
  const creatorMap = new Map<string, CreatorTableRow>();

  clicks.forEach((click) => {
    if (!click.creator_username) return;

    const existing = creatorMap.get(click.creator_username);
    if (existing) {
      existing.totalClicks++;
      if (click.submission_number)
        existing.submissions.add(click.submission_number);
      if (click.clicked_at && click.clicked_at > existing.lastClick) {
        existing.lastClick = click.clicked_at;
      }
    } else {
      creatorMap.set(click.creator_username, {
        username: click.creator_username,
        totalClicks: 1,
        lastClick: click.clicked_at || "",
        submissions: new Set(
          click.submission_number ? [click.submission_number] : []
        ),
      });
    }
  });

  return Array.from(creatorMap.values());
}

function sortCreatorRows(
  rows: CreatorTableRow[],
  column: CreatorTableSortColumn,
  direction: SortDirection
): CreatorTableRow[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    switch (column) {
      case "lastClick":
        cmp =
          new Date(a.lastClick || 0).getTime() -
          new Date(b.lastClick || 0).getTime();
        break;
      case "creator":
        cmp = a.username.localeCompare(b.username);
        break;
      case "totalClicks":
        cmp = a.totalClicks - b.totalClicks;
        break;
      case "totalSubmissions":
        cmp = a.submissions.size - b.submissions.size;
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

interface AnalyticsProps {
  link: Link;
  onBack: () => void;
  projectSlug: string;
}

interface AnalyticsData {
  totalClicks: number;
  clicksByLinkTitle: Record<string, number>;
  clicksByCreator: Record<string, number>;
  clicksBySubmission: Record<string, number>;
  clicksByCountry: Record<string, number>;
  clicksByCity: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByWeek: { week: string; clicks: number }[];
  filteredClicks: LinkClick[];
}

export function Analytics({ link, onBack, projectSlug }: AnalyticsProps) {
  const [allClicks, setAllClicks] = useState<LinkClick[]>([]);
  const [clickFilters, setClickFilters] =
    useState<ClickFilters>(DEFAULT_CLICK_FILTERS);
  const [creatorModalFilters, setCreatorModalFilters] =
    useState<ClickFilters>(DEFAULT_CLICK_FILTERS);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    // Initialize with Monday of current week
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // Initialize with Sunday of current week
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? 0 : 7);
    const sunday = new Date(today.setDate(diff));
    return sunday.toISOString().split("T")[0];
  });
  const [creatorAnalytics, setCreatorAnalytics] = useState<{
    clicks: LinkClick[];
    totalClicks: number;
    clicksBySubmission: Record<string, number>;
    clicksByCountry: Record<string, number>;
    clicksByCity: Record<string, number>;
    clicksByDevice: Record<string, number>;
    clicksByBrowser: Record<string, number>;
    allSubmissions: string[];
  } | null>(null);
  const [creatorTableSort, setCreatorTableSort] = useState<{
    column: CreatorTableSortColumn;
    direction: SortDirection;
  }>({ column: "lastClick", direction: "desc" });

  const loadAnalytics = useCallback(async () => {
    try {
      const { data: clicks, error } = await supabase
        .from("link_clicks")
        .select("*")
        .eq("link_id", link.id)
        .order("clicked_at", { ascending: false });

      if (error) throw error;
      setAllClicks(clicks || []);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [link.id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filterOptions = useMemo(
    () => extractFilterOptions(allClicks, clickFilters.country),
    [allClicks, clickFilters.country]
  );

  const filteredClicks = useMemo(
    () => allClicks.filter((click) => matchesClickFilters(click, clickFilters)),
    [allClicks, clickFilters]
  );

  const data = useMemo(
    () =>
      computeAnalyticsFromClicks(
        filteredClicks,
        link,
        startDate,
        endDate
      ),
    [filteredClicks, link, startDate, endDate]
  );

  const sortedCreatorRows = useMemo(
    () =>
      sortCreatorRows(
        buildCreatorRows(data.filteredClicks),
        creatorTableSort.column,
        creatorTableSort.direction
      ),
    [data.filteredClicks, creatorTableSort]
  );

  const handleCreatorTableSort = (column: CreatorTableSortColumn) => {
    setCreatorTableSort((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        column,
        direction: column === "creator" ? "asc" : "desc",
      };
    });
  };

  const updateClickFilter = (
    key: keyof ClickFilters,
    value: string
  ) => {
    setClickFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country" && prev.city !== FILTER_ALL && value !== FILTER_ALL) {
        const cityStillValid = allClicks.some(
          (c) => c.country === value && c.city === prev.city
        );
        if (!cityStillValid) next.city = FILTER_ALL;
      }
      return next;
    });
  };

  const clearClickFilters = () => setClickFilters(DEFAULT_CLICK_FILTERS);

  const creatorModalFilterOptions = useMemo(() => {
    if (!creatorAnalytics) {
      return {
        submissions: [],
        countries: [],
        cities: [],
        devices: [],
        browsers: [],
      };
    }
    return extractFilterOptions(
      creatorAnalytics.clicks,
      creatorModalFilters.country
    );
  }, [creatorAnalytics, creatorModalFilters.country]);

  const creatorModalFilteredClicks = useMemo(() => {
    if (!creatorAnalytics) return [];
    return creatorAnalytics.clicks.filter((click) =>
      matchesClickFilters(click, creatorModalFilters)
    );
  }, [creatorAnalytics, creatorModalFilters]);

  const updateCreatorModalFilter = (
    key: keyof ClickFilters,
    value: string
  ) => {
    setCreatorModalFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (
        key === "country" &&
        prev.city !== FILTER_ALL &&
        value !== FILTER_ALL &&
        creatorAnalytics
      ) {
        const cityStillValid = creatorAnalytics.clicks.some(
          (c) => c.country === value && c.city === prev.city
        );
        if (!cityStillValid) next.city = FILTER_ALL;
      }
      return next;
    });
  };

  const loadCreatorAnalytics = async (creatorUsername: string) => {
    try {
      const { data: clicks, error } = await supabase
        .from("link_clicks")
        .select("*")
        .eq("link_id", link.id)
        .eq("creator_username", creatorUsername)
        .order("clicked_at", { ascending: false });

      if (error) throw error;

      // Get all unique submissions
      const allSubmissions = Array.from(
        new Set(
          clicks?.map((click) => click.submission_number).filter(Boolean) || []
        )
      ).sort((a, b) => {
        const aIsNumeric = !isNaN(Number(a));
        const bIsNumeric = !isNaN(Number(b));

        if (aIsNumeric && bIsNumeric) {
          return Number(a) - Number(b);
        }
        if (aIsNumeric) return -1;
        if (bIsNumeric) return 1;
        return a.localeCompare(b);
      });

      const analytics = {
        clicks: clicks || [],
        totalClicks: clicks?.length || 0,
        clicksBySubmission: {} as Record<string, number>,
        clicksByCountry: {} as Record<string, number>,
        clicksByCity: {} as Record<string, number>,
        clicksByDevice: {} as Record<string, number>,
        clicksByBrowser: {} as Record<string, number>,
        allSubmissions,
      };

      clicks?.forEach((click) => {
        if (click.submission_number) {
          analytics.clicksBySubmission[click.submission_number] =
            (analytics.clicksBySubmission[click.submission_number] || 0) + 1;
        }
        if (click.country) {
          analytics.clicksByCountry[click.country] =
            (analytics.clicksByCountry[click.country] || 0) + 1;
        }
        if (click.city) {
          analytics.clicksByCity[click.city] =
            (analytics.clicksByCity[click.city] || 0) + 1;
        }
        if (click.device_type) {
          analytics.clicksByDevice[click.device_type] =
            (analytics.clicksByDevice[click.device_type] || 0) + 1;
        }
        if (click.browser) {
          analytics.clicksByBrowser[click.browser] =
            (analytics.clicksByBrowser[click.browser] || 0) + 1;
        }
      });

      setCreatorAnalytics(analytics);
      setSelectedCreator(creatorUsername);
      setCreatorModalFilters(DEFAULT_CLICK_FILTERS);
    } catch (error) {
      console.error("Error loading creator analytics:", error);
    }
  };

  const baseUrl = window.location.origin;
  const trackingUrl = `${baseUrl}/${projectSlug}/${link.short_code}`;
  const exampleUrl = `${trackingUrl}/johndoe/sub1`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 animate-pulse shadow-lg">
            <MousePointerClick className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-700 font-semibold text-lg">
            Loading analytics...
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 top-0 z-40 shadow-sm">
        <div className="max-w-7xl flex flex-row gap-3 mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="group flex items-center space-x-2 text-sm sm:text-base text-slate-600 hover:text-blue-600 mb-3 sm:mb-4 transition-all duration-200 hover:translate-x-[-4px]"
          >
            <div className="p-1 rounded-lg group-hover:bg-blue-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            {/* <span className="font-medium">Back to Links</span> */}
          </button>

          <div>
            <div className="flex flex-row gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                {link.link_title}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300">
                  {link.platform}
                </span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <span className="text-slate-600 font-semibold">
                  Destination:
                </span>
                <a
                  href={link.destination_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline break-all font-medium transition-colors"
                >
                  {link.destination_url}
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/60 p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">
                  Total Clicks
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {data.totalClicks}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/60 p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">
                  Creators
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {Object.keys(data.clicksByCreator).length}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/60 p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">
                  Devices
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {Object.keys(data.clicksByDevice).length}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Monitor className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MousePointerClick className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Tracking URL Format
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Use this format to track different creators for this platform
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-600 mb-2 font-medium">Format:</p>
              <code className="block bg-white px-3 sm:px-4 py-3 rounded-xl font-mono text-xs sm:text-sm text-slate-800 overflow-x-auto shadow-sm border border-slate-200">
                {trackingUrl}/[creator]/sub1
              </code>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-2 font-medium">
                Example:
              </p>
              <code className="block bg-gradient-to-r from-white to-blue-50 px-3 sm:px-4 py-3 rounded-xl font-mono text-xs sm:text-sm text-blue-600 overflow-x-auto shadow-sm border border-blue-200">
                {exampleUrl}
              </code>
            </div>
          </div>
        </div>

        <AnalyticsFiltersBar
          filters={clickFilters}
          options={filterOptions}
          onFilterChange={updateClickFilter}
          onClear={clearClickFilters}
          hasActive={hasActiveFilters(clickFilters)}
          totalUnfiltered={allClicks.length}
          totalFiltered={filteredClicks.length}
        />

        {/* Clicks Bar Chart */}
        <ClicksAnalyticsChart
          weeklyData={data.clicksByWeek}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onCurrentWeekClick={() => {
            const today = new Date();
            const day = today.getDay();
            const mondayDiff = today.getDate() - day + (day === 0 ? -6 : 1);
            const sundayDiff = today.getDate() - day + (day === 0 ? 0 : 7);

            const monday = new Date(today);
            monday.setDate(mondayDiff);
            const sunday = new Date(today);
            sunday.setDate(sundayDiff);

            setStartDate(monday.toISOString().split("T")[0]);
            setEndDate(sunday.toISOString().split("T")[0]);
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatsCard
            title="Clicks by Link Title"
            data={data.clicksByLinkTitle}
            color="blue"
          />
          <StatsCard
            title="Clicks by Creator"
            data={data.clicksByCreator}
            color="emerald"
          />
          <StatsCard
            title="Clicks by Submission"
            data={data.clicksBySubmission}
            color="orange"
          />
          <StatsCard
            title="Clicks by Country"
            data={data.clicksByCountry}
            color="cyan"
          />
          <StatsCard
            title="Clicks by City"
            data={data.clicksByCity}
            color="violet"
          />
          <StatsCard
            title="Clicks by Device"
            data={data.clicksByDevice}
            color="green"
          />
          <StatsCard
            title="Clicks by Browser"
            data={data.clicksByBrowser}
            color="slate"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Recent Clicks by Creator
              </h3>
              <p className="text-xs text-slate-600">
                Overview of creator activity
              </p>
            </div>
          </div>
          {data.filteredClicks.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <MousePointerClick className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                {allClicks.length === 0
                  ? "No clicks recorded yet"
                  : "No clicks match the current filters"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {allClicks.length === 0
                  ? "Start sharing your tracking links to see analytics"
                  : "Try adjusting or clearing your filters"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 max-h-[500px] overflow-y-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                      {(
                        [
                          {
                            key: "lastClick" as const,
                            label: "Last Click",
                          },
                          { key: "creator" as const, label: "Creator" },
                          {
                            key: "totalClicks" as const,
                            label: "Total Clicks",
                          },
                          {
                            key: "totalSubmissions" as const,
                            label: "Total Submissions",
                          },
                        ] as const
                      ).map(({ key, label }) => {
                        const isActive = creatorTableSort.column === key;
                        const SortIcon = isActive
                          ? creatorTableSort.direction === "asc"
                            ? ArrowUp
                            : ArrowDown
                          : ArrowUpDown;
                        return (
                          <th
                            key={key}
                            aria-sort={
                              isActive
                                ? creatorTableSort.direction === "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                            className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap"
                          >
                            <button
                              type="button"
                              onClick={() => handleCreatorTableSort(key)}
                              className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors group/sort"
                            >
                              {label}
                              <SortIcon
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  isActive
                                    ? "text-blue-600"
                                    : "text-slate-400 opacity-0 group-hover/sort:opacity-100"
                                }`}
                              />
                            </button>
                          </th>
                        );
                      })}
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCreatorRows.map((creator) => (
                        <tr
                          key={creator.username}
                          className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 group"
                        >
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap font-medium">
                            {creator.lastClick ? (
                              new Date(creator.lastClick).toLocaleDateString(
                                "en-GB"
                              )
                            ) : (
                              <span className="text-red-500">No timestamp</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap font-semibold">
                            <div className="flex items-center gap-2">
                              {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {creator.username.charAt(0).toUpperCase()}
                              </div> */}
                              <span>{creator.username}</span>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-bold shadow-sm">
                              {creator.totalClicks}
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                            {creator.submissions.size > 0 ? (
                              <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full text-xs font-bold shadow-sm">
                                {creator.submissions.size}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                loadCreatorAnalytics(creator.username)
                              }
                              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group-hover:scale-105"
                              title={`View detailed analytics for ${creator.username}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Creator Analytics Modal */}
      {selectedCreator && creatorAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSelectedCreator(null);
              setCreatorAnalytics(null);
            }}
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="top-0 bg-gradient-to-r from-white to-blue-50/30 border-b border-slate-200 p-4 sm:p-6 z-10 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {selectedCreator.charAt(0).toUpperCase()}
                  </div> */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Analytics for {selectedCreator}
                    </h2>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Detailed analytics for this creator&apos;s activity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCreator(null);
                    setCreatorAnalytics(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnalyticsFiltersBar
                filters={creatorModalFilters}
                options={creatorModalFilterOptions}
                onFilterChange={updateCreatorModalFilter}
                onClear={() => setCreatorModalFilters(DEFAULT_CLICK_FILTERS)}
                hasActive={hasActiveFilters(creatorModalFilters)}
                totalUnfiltered={creatorAnalytics.clicks.length}
                totalFiltered={creatorModalFilteredClicks.length}
                compact
              />
            </div>

            <div className="p-4 sm:p-6">
              {(() => {
                const filteredClicks = creatorModalFilteredClicks;

                // Calculate filtered analytics
                const filteredAnalytics = {
                  totalClicks: filteredClicks.length,
                  clicksBySubmission: {} as Record<string, number>,
                  clicksByCountry: {} as Record<string, number>,
                  clicksByCity: {} as Record<string, number>,
                  clicksByDevice: {} as Record<string, number>,
                  clicksByBrowser: {} as Record<string, number>,
                };

                filteredClicks.forEach((click) => {
                  if (click.submission_number) {
                    filteredAnalytics.clicksBySubmission[
                      click.submission_number
                    ] =
                      (filteredAnalytics.clicksBySubmission[
                        click.submission_number
                      ] || 0) + 1;
                  }
                  if (click.country) {
                    filteredAnalytics.clicksByCountry[click.country] =
                      (filteredAnalytics.clicksByCountry[click.country] || 0) +
                      1;
                  }
                  if (click.city) {
                    filteredAnalytics.clicksByCity[click.city] =
                      (filteredAnalytics.clicksByCity[click.city] || 0) + 1;
                  }
                  if (click.device_type) {
                    filteredAnalytics.clicksByDevice[click.device_type] =
                      (filteredAnalytics.clicksByDevice[click.device_type] ||
                        0) + 1;
                  }
                  if (click.browser) {
                    filteredAnalytics.clicksByBrowser[click.browser] =
                      (filteredAnalytics.clicksByBrowser[click.browser] || 0) +
                      1;
                  }
                });

                return (
                  <>
                    {/* Summary Stats - Filtered based on selected submission */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-600 mb-1 font-medium">
                              Total Clicks
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {filteredAnalytics.totalClicks}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <MousePointerClick className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-600 mb-1 font-medium">
                              Browsers
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {
                                Object.keys(filteredAnalytics.clicksByBrowser)
                                  .length
                              }
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-emerald-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-600 mb-1 font-medium">
                              Submissions
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {
                                Object.keys(
                                  filteredAnalytics.clicksBySubmission
                                ).length
                              }
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-orange-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-600 mb-1 font-medium">
                              Devices
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {
                                Object.keys(filteredAnalytics.clicksByDevice)
                                  .length
                              }
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-cyan-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Stats - Filtered based on selected submission */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <StatsCard
                        title="Clicks by Submission"
                        data={filteredAnalytics.clicksBySubmission}
                        color="orange"
                      />
                      <StatsCard
                        title="Clicks by Country"
                        data={filteredAnalytics.clicksByCountry}
                        color="cyan"
                      />
                      <StatsCard
                        title="Clicks by City"
                        data={filteredAnalytics.clicksByCity}
                        color="violet"
                      />
                      <StatsCard
                        title="Clicks by Device"
                        data={filteredAnalytics.clicksByDevice}
                        color="green"
                      />
                      <StatsCard
                        title="Clicks by Browser"
                        data={filteredAnalytics.clicksByBrowser}
                        color="slate"
                      />
                    </div>
                  </>
                );
              })()}

              {/* Clicks Table */}
              {(() => {
                const filteredClicks = creatorModalFilteredClicks;

                return (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4 sm:mb-5">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {hasActiveFilters(creatorModalFilters)
                            ? "Filtered Clicks"
                            : "All Clicks"}
                        </h3>
                        <p className="text-xs text-slate-600">
                          Detailed click information
                        </p>
                      </div>
                    </div>
                    {filteredClicks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                          <MousePointerClick className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm sm:text-base text-slate-600 font-medium">
                          No clicks recorded for this filter
                        </p>
                      </div>
                    ) : creatorModalFilters.submission === FILTER_ALL ? (
                      // Single table when not filtering by a specific submission
                      <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl max-h-[500px] overflow-y-auto">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                  Date
                                </th>
                                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                  Submission
                                </th>
                                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                  Country
                                </th>
                                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                  Device
                                </th>
                                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                  Browser
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredClicks
                                .sort((a, b) => {
                                  // Sort by time (most recent first)
                                  if (!a.clicked_at) return 1;
                                  if (!b.clicked_at) return -1;
                                  return (
                                    new Date(b.clicked_at).getTime() -
                                    new Date(a.clicked_at).getTime()
                                  );
                                })
                                .map((click) => (
                                  <tr
                                    key={click.id}
                                    className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-all duration-200"
                                  >
                                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                                      {click.clicked_at ? (
                                        <div className="text-black">
                                          {new Date(
                                            click.clicked_at
                                          ).toLocaleDateString("en-GB")}
                                        </div>
                                      ) : (
                                        <span className="text-red-500 font-medium">
                                          No timestamp
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                                      <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 rounded-full text-xs font-bold shadow-sm">
                                        {click.submission_number || "-"}
                                      </span>
                                    </td>
                                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap font-medium">
                                      {click.country || (
                                        <span className="text-slate-400">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap font-medium">
                                      {click.device_type || (
                                        <span className="text-slate-400">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap font-medium">
                                      {click.browser || (
                                        <span className="text-slate-400">
                                          -
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          // Group clicks by submission number
                          const submissionMap = new Map<string, LinkClick[]>();

                          filteredClicks.forEach((click) => {
                            const submission =
                              click.submission_number || "No Submission";
                            if (!submissionMap.has(submission)) {
                              submissionMap.set(submission, []);
                            }
                            submissionMap.get(submission)!.push(click);
                          });

                          // Sort submissions - numeric ones first in ascending order, then others
                          const sortedSubmissions = Array.from(
                            submissionMap.entries()
                          ).sort((a, b) => {
                            const aIsNumeric = !isNaN(Number(a[0]));
                            const bIsNumeric = !isNaN(Number(b[0]));

                            if (aIsNumeric && bIsNumeric) {
                              return Number(a[0]) - Number(b[0]);
                            }
                            if (aIsNumeric) return -1;
                            if (bIsNumeric) return 1;
                            return a[0].localeCompare(b[0]);
                          });

                          return sortedSubmissions.map(
                            ([submission, clicks]) => (
                              <div
                                key={submission}
                                className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                              >
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-5 py-3 sm:py-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                          {submission}
                                        </span>
                                      </div>
                                      <h4 className="text-base font-bold text-white">
                                        Submission: {submission}
                                      </h4>
                                    </div>
                                    <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold shadow-lg">
                                      {clicks.length}{" "}
                                      {clicks.length === 1 ? "click" : "clicks"}
                                    </span>
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full bg-white">
                                    <thead>
                                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                          Date
                                        </th>
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                          Country
                                        </th>
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                          Device
                                        </th>
                                        <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                                          Browser
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {clicks
                                        .sort((a, b) => {
                                          // Sort clicks within submission by time (most recent first)
                                          if (!a.clicked_at) return 1;
                                          if (!b.clicked_at) return -1;
                                          return (
                                            new Date(b.clicked_at).getTime() -
                                            new Date(a.clicked_at).getTime()
                                          );
                                        })
                                        .map((click) => (
                                          <tr
                                            key={click.id}
                                            className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent transition-all duration-200"
                                          >
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                                              {click.clicked_at ? (
                                                <div className="text-slate-900">
                                                  {new Date(
                                                    click.clicked_at
                                                  ).toLocaleDateString("en-GB")}
                                                </div>
                                              ) : (
                                                <span className="text-red-500 font-medium">
                                                  No timestamp
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap font-medium">
                                              {click.country || (
                                                <span className="text-slate-400">
                                                  -
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap font-medium">
                                              {click.device_type || (
                                                <span className="text-slate-400">
                                                  -
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap font-medium">
                                              {click.browser || (
                                                <span className="text-slate-400">
                                                  -
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsFiltersBar({
  filters,
  options,
  onFilterChange,
  onClear,
  hasActive,
  totalUnfiltered,
  totalFiltered,
  compact = false,
}: {
  filters: ClickFilters;
  options: ReturnType<typeof extractFilterOptions>;
  onFilterChange: (key: keyof ClickFilters, value: string) => void;
  onClear: () => void;
  hasActive: boolean;
  totalUnfiltered: number;
  totalFiltered: number;
  compact?: boolean;
}) {
  const selectClass =
    "w-full px-3 py-2 text-sm font-medium border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white hover:border-slate-400 transition-colors";

  const filterFields: {
    key: keyof ClickFilters;
    label: string;
    values: string[];
    disabled?: boolean;
  }[] = [
    { key: "submission", label: "Submission", values: options.submissions },
    { key: "country", label: "Country", values: options.countries },
    {
      key: "city",
      label: "City",
      values: options.cities,
      disabled:
        filters.country !== FILTER_ALL && options.cities.length === 0,
    },
    { key: "device", label: "Device", values: options.devices },
    { key: "browser", label: "Browser", values: options.browsers },
  ];

  if (
    totalUnfiltered === 0 &&
    !filterFields.some((f) => f.values.length > 0)
  ) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-slate-200/60 mb-6 sm:mb-8 ${
        compact ? "p-3 sm:p-4" : "p-4 sm:p-6"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Filters
            </h3>
            <p className="text-xs text-slate-600">
              Showing {totalFiltered} of {totalUnfiltered} clicks
            </p>
          </div>
        </div>
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800 px-4 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-200 self-start sm:self-auto"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {filterFields.map(({ key, label, values, disabled }) => (
          <div key={key}>
            <label
              htmlFor={`filter-${compact ? "modal-" : ""}${key}`}
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              {label}
            </label>
            <select
              id={`filter-${compact ? "modal-" : ""}${key}`}
              value={filters[key]}
              disabled={disabled || values.length === 0}
              onChange={(e) => onFilterChange(key, e.target.value)}
              className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value={FILTER_ALL}>
                All {label}s
                {values.length > 0 ? ` (${values.length})` : ""}
              </option>
              {values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {hasActive && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Active:
          </span>
          {filterFields.map(({ key, label }) => {
            const value = filters[key];
            if (value === FILTER_ALL) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-semibold"
              >
                {label}: {value}
                <button
                  type="button"
                  onClick={() => onFilterChange(key, FILTER_ALL)}
                  className="hover:text-violet-950"
                  aria-label={`Clear ${label} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  data,
  color,
}: {
  title: string;
  data: Record<string, number>;
  color: string;
}) {
  // Sort entries based on the title
  const entries = Object.entries(data).sort((a, b) => {
    // For "Clicks by Submission", sort by submission number in ascending order
    if (title === "Clicks by Submission") {
      const aIsNumeric = !isNaN(Number(a[0]));
      const bIsNumeric = !isNaN(Number(b[0]));

      if (aIsNumeric && bIsNumeric) {
        return Number(a[0]) - Number(b[0]); // Ascending numeric order
      }
      if (aIsNumeric) return -1;
      if (bIsNumeric) return 1;
      return a[0].localeCompare(b[0]); // Alphabetical order for non-numeric
    }

    // For all other cards, sort by count (descending)
    return b[1] - a[1];
  });
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    orange: "from-orange-500 to-orange-600",
    cyan: "from-cyan-500 to-cyan-600",
    violet: "from-violet-500 to-violet-600",
    green: "from-green-500 to-green-600",
    slate: "from-slate-500 to-slate-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2">
        <div
          className={`w-1 h-6 rounded-full bg-gradient-to-b ${colorMap[color]}`}
        ></div>
        {title}
      </h3>
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            No data available
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {entries.map(([key, count], idx) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={key} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-500 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                      {key || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {percentage.toFixed(0)}%
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                      {count}
                    </span>
                  </div>
                </div>
                <div className="relative w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full bg-gradient-to-r ${colorMap[color]} transition-all duration-500 ease-out relative`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
