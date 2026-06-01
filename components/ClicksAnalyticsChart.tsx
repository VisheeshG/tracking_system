"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

interface ClicksAnalyticsChartProps {
  weeklyData: { week: string; clicks: number }[];
  startDate: string;
  endDate: string;
  totalClicksInRange?: number;
}

// Format large numbers with Indian numbering system
function formatNumber(num: number): string {
  if (num >= 10000000) {
    // 1 crore and above
    return `${(num / 10000000).toFixed(2)}Cr`;
  } else if (num >= 100000) {
    // 1 lakh and above
    return `${(num / 100000).toFixed(2)}L`;
  } else if (num >= 1000) {
    // 1 thousand and above
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toString();
}

// Format with commas for display
function formatNumberWithCommas(num: number): string {
  return num.toLocaleString("en-IN");
}

export function ClicksAnalyticsChart({
  weeklyData,
  startDate,
  endDate,
  totalClicksInRange,
}: ClicksAnalyticsChartProps) {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Always show the chart, even if there are no clicks
  if (weeklyData.length === 0) {
    return null;
  }

  const totalClicks =
    totalClicksInRange ??
    weeklyData.reduce((sum, day) => sum + day.clicks, 0);

  // Responsive chart configuration based on window width
  const getChartConfig = () => {
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    return {
      margin: {
        top: 5,
        right: isMobile ? 5 : isTablet ? 20 : 30,
        left: isMobile ? -10 : isTablet ? -5 : 0,
        bottom: 5,
      },
      fontSize: isMobile ? "0.625rem" : isTablet ? "0.7rem" : "0.75rem",
      yAxisWidth: isMobile ? 30 : isTablet ? 40 : 50,
      xAxisHeight: weeklyData.length > 7 ? (isMobile ? 60 : 80) : 30,
      xAxisInterval: isMobile && weeklyData.length > 10 ? 1 : 0,
      barSize: isMobile ? 20 : windowWidth < 768 ? 30 : isTablet ? 35 : 40,
      tooltipFontSize: isMobile ? "0.75rem" : "0.875rem",
      legendFontSize: isMobile ? "0.75rem" : "0.875rem",
      legendIconSize: isMobile ? 8 : 10,
      legendPaddingTop: isMobile ? "8px" : "10px",
    };
  };

  const chartConfig = getChartConfig();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Clicks over time
            </h3>
            <p className="text-xs text-slate-600">
              {`${dayjs(startDate).format("MMM D, YYYY")} - ${dayjs(
                endDate
              ).format("MMM D, YYYY")}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
          {/* Statistics Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-md text-slate-600 font-medium whitespace-nowrap">
                  Total Clicks:
                </p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {formatNumberWithCommas(totalClicks)}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="w-full h-48 sm:h-64 md:h-72 lg:h-80 xl:h-96 overflow-x-auto overflow-y-hidden">
        <div
          style={{
            minWidth: `${Math.max(
              weeklyData.length * (chartConfig.barSize + 20),
              windowWidth < 640 ? 320 : 600
            )}px`,
            height: "100%",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={chartConfig.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="week"
                stroke="#64748b"
                style={{ fontSize: chartConfig.fontSize }}
                angle={weeklyData.length > 7 ? -45 : 0}
                textAnchor={weeklyData.length > 7 ? "end" : "middle"}
                height={chartConfig.xAxisHeight}
                interval={0}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: chartConfig.fontSize }}
                allowDecimals={false}
                width={chartConfig.yAxisWidth}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  fontSize: chartConfig.tooltipFontSize,
                }}
                labelStyle={{ color: "#0f172a", fontWeight: "bold" }}
                formatter={(value: number) => [
                  formatNumberWithCommas(value),
                  "Clicks",
                ]}
              />
              <Legend
                wrapperStyle={{
                  fontSize: chartConfig.legendFontSize,
                  paddingTop: chartConfig.legendPaddingTop,
                }}
                iconType="circle"
                iconSize={chartConfig.legendIconSize}
              />
              <Bar
                dataKey="clicks"
                fill="url(#colorClicks)"
                radius={[8, 8, 0, 0]}
                name="Clicks"
                barSize={chartConfig.barSize}
              />
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
