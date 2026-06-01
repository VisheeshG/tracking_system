import { LinkClick } from "@/lib/supabase";

export type AggregatedClickAnalytics = {
  totalClicks: number;
  clicksByLinkTitle: Record<string, number>;
  clicksByCreator: Record<string, number>;
  clicksBySubmission: Record<string, number>;
  clicksByCountry: Record<string, number>;
  clicksByState: Record<string, number>;
  clicksByCity: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByWeek: { week: string; clicks: number }[];
  filteredClicks: LinkClick[];
};

export function getDateString(date: Date): string {
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

export function aggregateClicks(
  clicks: LinkClick[],
  linkIdToTitle: Record<string, string>,
  startDate: string,
  endDate: string
): AggregatedClickAnalytics {
  const filteredClicks = filterClicksInDateRange(clicks, startDate, endDate);

  const analyticsData: AggregatedClickAnalytics = {
    totalClicks: filteredClicks.length,
    clicksByLinkTitle: {},
    clicksByCreator: {},
    clicksBySubmission: {},
    clicksByCountry: {},
    clicksByState: {},
    clicksByCity: {},
    clicksByDevice: {},
    clicksByBrowser: {},
    clicksByWeek: [],
    filteredClicks,
  };

  const dailyClicksMap: Record<string, number> = {};

  filteredClicks.forEach((click) => {
    const linkTitle = linkIdToTitle[click.link_id] ?? "Unknown link";
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

    if (click.state) {
      analyticsData.clicksByState[click.state] =
        (analyticsData.clicksByState[click.state] || 0) + 1;
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
      dailyClicksMap[dateString] = (dailyClicksMap[dateString] || 0) + 1;
    }
  });

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const rangeDays: { week: string; clicks: number }[] = [];
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

export function getDefaultWeekDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const day = today.getDay();
  const mondayDiff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(mondayDiff);
  const sundayDiff = today.getDate() - day + (day === 0 ? 0 : 7);
  const sunday = new Date(today);
  sunday.setDate(sundayDiff);

  return {
    startDate: getDateString(monday),
    endDate: getDateString(sunday),
  };
}

export type BreakdownEntry = { label: string; count: number };

export function sortedEntries(
  record: Record<string, number>
): BreakdownEntry[] {
  return Object.entries(record)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function topEntries(
  record: Record<string, number>,
  limit = 5
): BreakdownEntry[] {
  return sortedEntries(record).slice(0, limit);
}

export function allEntries(record: Record<string, number>): BreakdownEntry[] {
  return sortedEntries(record);
}

export function filterClicksInDateRange(
  clicks: LinkClick[],
  startDate: string,
  endDate: string
): LinkClick[] {
  return clicks.filter((click) => {
    if (!click.clicked_at) return false;
    const dateString = getDateString(new Date(click.clicked_at));
    return dateString >= startDate && dateString <= endDate;
  });
}
