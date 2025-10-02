"use client";

import { useState } from "react";
import { Link } from "@/lib/supabase";
import { Link2, Copy, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

interface LinkListProps {
  links: Link[];
  onSelectLink: (link: Link) => void;
  onDeleteLink: (linkId: string) => void;
  onToggleActive: (linkId: string, isActive: boolean) => void;
}

export function LinkList({
  links,
  onSelectLink,
  onDeleteLink,
  onToggleActive,
}: LinkListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (
    e: React.MouseEvent,
    shortCode: string,
    linkId: string
  ) => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}/l/${shortCode}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (e: React.MouseEvent, linkId: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this link? This will also delete all associated analytics data."
      )
    ) {
      onDeleteLink(linkId);
    }
  };

  const handleToggle = (
    e: React.MouseEvent,
    linkId: string,
    currentState: boolean
  ) => {
    e.stopPropagation();
    onToggleActive(linkId, !currentState);
  };

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <div
          key={link.id}
          onClick={() => onSelectLink(link)}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition flex-shrink-0">
                <Link2 className="w-6 h-6 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    {link.title}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    Platform
                  </span>
                  {link.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-slate-600 flex items-center space-x-2">
                    <span className="font-medium">Destination:</span>
                    <a
                      href={link.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {link.destination_url}
                    </a>
                  </p>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-600">
                      Tracking URL:
                    </span>
                    <code className="text-sm bg-slate-100 px-2 py-1 rounded font-mono text-slate-800">
                      /l/{link.short_code}
                    </code>
                  </div>

                  {link.submission_number && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-600">
                        Submission:
                      </span>
                      <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                        {link.submission_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={(e) => handleToggle(e, link.id, link.is_active)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title={link.is_active ? "Deactivate" : "Activate"}
              >
                {link.is_active ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={(e) => handleCopy(e, link.short_code, link.id)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Copy tracking URL"
              >
                {copiedId === link.id ? (
                  <span className="text-xs text-green-600 font-medium">
                    Copied!
                  </span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={(e) => handleDelete(e, link.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete link"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Created {new Date(link.created_at).toLocaleDateString()}
            </span>
            <div className="flex items-center space-x-2 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
              <span>View Analytics</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
