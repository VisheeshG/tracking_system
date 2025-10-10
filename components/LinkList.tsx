"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/supabase";
import { Link2, Copy, Trash2, ExternalLink, AlertTriangle } from "lucide-react";

interface LinkListProps {
  links: Link[];
  onSelectLink: (link: Link) => void;
  onDeleteLink: (linkId: string) => void;
  projectSlug: string;
  readOnly?: boolean;
  enableSelectInReadOnly?: boolean;
}

export function LinkList({
  links,
  onSelectLink,
  onDeleteLink,
  projectSlug,
  readOnly = false,
  enableSelectInReadOnly = false,
}: LinkListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    linkId: string | null;
    linkTitle: string | null;
  }>({ show: false, linkId: null, linkTitle: null });

  // Set base URL on component mount
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const handleCopy = (
    e: React.MouseEvent,
    shortCode: string,
    linkId: string
  ) => {
    e.stopPropagation();
    const trackingUrl = `${baseUrl}/${projectSlug}/${shortCode}/[creator]/sub1`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (
    e: React.MouseEvent,
    linkId: string,
    linkTitle: string
  ) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, linkId, linkTitle });
  };

  const confirmDelete = () => {
    if (deleteConfirm.linkId) {
      onDeleteLink(deleteConfirm.linkId);
      setDeleteConfirm({ show: false, linkId: null, linkTitle: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, linkId: null, linkTitle: null });
  };

  return (
    <>
      <div className="space-y-4">
        {links.map((link) => (
          <div
            key={link.id}
            onClick={() => {
              if (!readOnly || enableSelectInReadOnly) {
                onSelectLink(link);
              }
            }}
            className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md hover:border-blue-300 transition group ${
              readOnly && !enableSelectInReadOnly
                ? "cursor-default"
                : "cursor-pointer"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition flex-shrink-0">
                  <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition break-words">
                      {link.link_title}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium self-start">
                      {link.platform}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium block sm:inline">
                        Destination:
                      </span>
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline break-all block sm:inline sm:ml-2"
                      >
                        {link.destination_url}
                      </a>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-slate-600 block sm:inline">
                        Tracking URL:
                      </span>
                      <code className="text-xs sm:text-sm bg-slate-100 px-2 py-1 rounded font-mono text-slate-800 break-all block sm:inline sm:ml-2 mt-1 sm:mt-0">
                        {baseUrl}/{projectSlug}/{link.short_code}/[creator]/sub1
                      </code>
                    </div>

                    {/* {link.submission_number && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">
                          Submission:
                        </span>
                        <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                          {link.submission_number}
                        </span>
                      </div>
                    )} */}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:ml-4 self-end sm:self-start">
                <button
                  onClick={(e) => handleCopy(e, link.short_code, link.id)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Copy tracking URL"
                >
                  {copiedId === link.id ? (
                    <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                      Copied!
                    </span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {!readOnly && (
                  <button
                    onClick={(e) => handleDelete(e, link.id, link.link_title)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs text-slate-500">
                Created {new Date(link.created_at).toLocaleDateString()}
              </span>
              {!readOnly && (
                <div className="flex items-center space-x-2 text-blue-600 text-sm font-medium sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <span>View Analytics</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelDelete}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Delete Link
              </h3>
            </div>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteConfirm.linkTitle}</span>?
              This will also delete all associated analytics data. This action
              cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition font-medium"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
