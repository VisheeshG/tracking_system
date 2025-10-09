"use client";

import { useState, useEffect, useCallback } from "react";
import { Link, LinkClick, supabase } from "@/lib/supabase";
import { ArrowLeft, MousePointerClick, Monitor, Users } from "lucide-react";

interface AnalyticsProps {
  link: Link;
  onBack: () => void;
  projectSlug: string;
}

interface AnalyticsData {
  totalClicks: number;
  clicksByPlatform: Record<string, number>;
  clicksByCreator: Record<string, number>;
  clicksBySubmission: Record<string, number>;
  clicksByCountry: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  recentClicks: LinkClick[];
}

export function Analytics({ link, onBack, projectSlug }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData>({
    totalClicks: 0,
    clicksByPlatform: {},
    clicksByCreator: {},
    clicksBySubmission: {},
    clicksByCountry: {},
    clicksByDevice: {},
    clicksByBrowser: {},
    recentClicks: [],
  });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const { data: clicks, error } = await supabase
        .from("link_clicks")
        .select("*")
        .eq("link_id", link.id)
        .order("clicked_at", { ascending: false });

      if (error) throw error;

      const analyticsData: AnalyticsData = {
        totalClicks: clicks?.length || 0,
        clicksByPlatform: {},
        clicksByCreator: {},
        clicksBySubmission: {},
        clicksByCountry: {},
        clicksByDevice: {},
        clicksByBrowser: {},
        recentClicks: clicks?.slice(0, 10) || [],
      };

      // Debug: Log raw click data to see what's being stored
      console.log("Raw clicks data:", clicks);
      console.log(
        "Timestamps found:",
        clicks?.map((c) => ({
          id: c.id,
          clicked_at: c.clicked_at,
          type: typeof c.clicked_at,
        }))
      );
      console.log(
        "Countries found:",
        clicks?.map((c) => ({ id: c.id, country: c.country, city: c.city }))
      );

      clicks?.forEach((click) => {
        // Use platform name for analytics
        const platformName = link.platform;
        analyticsData.clicksByPlatform[platformName] =
          (analyticsData.clicksByPlatform[platformName] || 0) + 1;

        if (click.creator_username) {
          analyticsData.clicksByCreator[click.creator_username] =
            (analyticsData.clicksByCreator[click.creator_username] || 0) + 1;
        }

        if (click.submission_number) {
          analyticsData.clicksBySubmission[click.submission_number] =
            (analyticsData.clicksBySubmission[click.submission_number] || 0) +
            1;
        }

        if (click.country) {
          analyticsData.clicksByCountry[click.country] =
            (analyticsData.clicksByCountry[click.country] || 0) + 1;
        } else {
          // Debug: Log clicks without country data
          console.log("Click without country data:", {
            id: click.id,
            country: click.country,
            city: click.city,
            clicked_at: click.clicked_at,
          });
        }

        if (click.device_type) {
          analyticsData.clicksByDevice[click.device_type] =
            (analyticsData.clicksByDevice[click.device_type] || 0) + 1;
        }

        if (click.browser) {
          analyticsData.clicksByBrowser[click.browser] =
            (analyticsData.clicksByBrowser[click.browser] || 0) + 1;
        }
      });

      // Debug: Log final analytics data
      console.log("Analytics data:", analyticsData);

      setData(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [link]);

  useEffect(() => {
    loadAnalytics();
  }, [link, loadAnalytics]);

  const baseUrl = window.location.origin;
  const trackingUrl = `${baseUrl}/${projectSlug}/${link.short_code}`;
  const exampleUrl = `${trackingUrl}/johndoe/${link.submission_number}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-sm sm:text-base text-slate-600 hover:text-slate-900 mb-3 sm:mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Links</span>
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
              {link.link_title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Platform: {link.platform}
            </p>
            <div className="mt-2 sm:mt-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <span className="text-slate-600 font-medium">Destination:</span>
                <a
                  href={link.destination_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {link.destination_url}
                </a>
              </div>
              {/* <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-medium text-sm">
                  Tracking URL:
                </span>
                <code className="text-sm bg-slate-100 px-3 py-1 rounded font-mono text-slate-800">
                  {trackingUrl}
                </code>
              </div> */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">
                  Total Clicks
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {data.totalClicks}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Platforms</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {Object.keys(data.clicksByPlatform).length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
          </div> */}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">
                  Creators
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {Object.keys(data.clicksByCreator).length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">
                  Devices
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {Object.keys(data.clicksByDevice).length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
            Tracking URL Format
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-3">
            Use this format to track different creators and submissions for this
            platform:
          </p>
          <code className="block bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-mono text-xs sm:text-sm text-slate-800 mb-2 overflow-x-auto">
            {trackingUrl}/[creator]/{link.submission_number}
          </code>
          <p className="text-xs text-slate-600 mb-2">Example:</p>
          <code className="block bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-mono text-xs sm:text-sm text-blue-600 overflow-x-auto">
            {exampleUrl}
          </code>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatsCard
            title="Clicks by Platform"
            data={data.clicksByPlatform}
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            Recent Clicks
          </h3>
          {data.recentClicks.length === 0 ? (
            <p className="text-sm sm:text-base text-slate-600 text-center py-8">
              No clicks recorded yet
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                        Time
                      </th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                        Platform
                      </th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                        Creator
                      </th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                        Submission
                      </th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                        Country
                      </th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                        Device
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentClicks.map((click) => (
                      <tr
                        key={click.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                          {click.clicked_at ? (
                            new Date(click.clicked_at).toLocaleDateString(
                              "en-GB"
                            )
                          ) : (
                            <span className="text-red-500">No timestamp</span>
                          )}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                          {link.platform}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                          {click.creator_username || "-"}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                          {click.submission_number || "-"}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                          {click.country || "-"}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                          {click.device_type || "-"}
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
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const colorMap: Record<string, string> = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    orange: "bg-orange-600",
    cyan: "bg-cyan-600",
    green: "bg-green-600",
    slate: "bg-slate-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-slate-600 text-xs sm:text-sm">No data available</p>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {entries.map(([key, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium text-slate-700 truncate pr-2">
                    {key || "Unknown"}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 flex-shrink-0">
                    {count}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colorMap[color]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
