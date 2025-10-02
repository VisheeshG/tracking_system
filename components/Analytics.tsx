'use client';

import { useState, useEffect } from 'react';
import { Link, LinkClick, supabase } from '@/lib/supabase';
import { ArrowLeft, MousePointerClick, Globe, Monitor, Users } from 'lucide-react';

interface AnalyticsProps {
  link: Link;
  onBack: () => void;
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

export function Analytics({ link, onBack }: AnalyticsProps) {
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

  useEffect(() => {
    loadAnalytics();
  }, [link]);

  const loadAnalytics = async () => {
    try {
      const { data: clicks, error } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('link_id', link.id)
        .order('clicked_at', { ascending: false });

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

      clicks?.forEach((click) => {
        if (click.platform_name) {
          analyticsData.clicksByPlatform[click.platform_name] =
            (analyticsData.clicksByPlatform[click.platform_name] || 0) + 1;
        }

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

        if (click.device_type) {
          analyticsData.clicksByDevice[click.device_type] =
            (analyticsData.clicksByDevice[click.device_type] || 0) + 1;
        }

        if (click.browser) {
          analyticsData.clicksByBrowser[click.browser] =
            (analyticsData.clicksByBrowser[click.browser] || 0) + 1;
        }
      });

      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseUrl = window.location.origin;
  const trackingUrl = `${baseUrl}/l/${link.short_code}`;
  const exampleUrl = `${trackingUrl}/goc/johndoe/sub1`;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Links</span>
          </button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">{link.title}</h1>
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-slate-600 font-medium">Destination:</span>
                <a
                  href={link.destination_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link.destination_url}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-medium text-sm">Tracking URL:</span>
                <code className="text-sm bg-slate-100 px-3 py-1 rounded font-mono text-slate-800">
                  {trackingUrl}
                </code>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Clicks</p>
                <p className="text-3xl font-bold text-slate-900">{data.totalClicks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Platforms</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Object.keys(data.clicksByPlatform).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Creators</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Object.keys(data.clicksByCreator).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Devices</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Object.keys(data.clicksByDevice).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Tracking URL Format</h3>
          <p className="text-sm text-slate-600 mb-3">
            Use this format to track different platforms, creators, and submissions:
          </p>
          <code className="block bg-white px-4 py-3 rounded-lg font-mono text-sm text-slate-800 mb-2">
            {trackingUrl}/[platform]/[creator]/[submission]
          </code>
          <p className="text-xs text-slate-600 mb-2">Example:</p>
          <code className="block bg-white px-4 py-3 rounded-lg font-mono text-sm text-blue-600">
            {exampleUrl}
          </code>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatsCard title="Clicks by Platform" data={data.clicksByPlatform} color="blue" />
          <StatsCard title="Clicks by Creator" data={data.clicksByCreator} color="emerald" />
          <StatsCard title="Clicks by Submission" data={data.clicksBySubmission} color="orange" />
          <StatsCard title="Clicks by Country" data={data.clicksByCountry} color="cyan" />
          <StatsCard title="Clicks by Device" data={data.clicksByDevice} color="green" />
          <StatsCard title="Clicks by Browser" data={data.clicksByBrowser} color="slate" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Clicks</h3>
          {data.recentClicks.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No clicks recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Platform</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Creator</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Submission</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Country</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentClicks.map((click) => (
                    <tr key={click.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(click.clicked_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {click.platform_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {click.creator_username || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {click.submission_number || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {click.country || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {click.device_type || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, data, color }: { title: string; data: Record<string, number>; color: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    orange: 'bg-orange-600',
    cyan: 'bg-cyan-600',
    green: 'bg-green-600',
    slate: 'bg-slate-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-slate-600 text-sm">No data available</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([key, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{key || 'Unknown'}</span>
                  <span className="text-sm font-semibold text-slate-900">{count}</span>
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