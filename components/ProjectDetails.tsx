"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Project, Link, supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Link2,
  TrendingUp,
  MousePointerClick,
} from "lucide-react";
import { LinkList } from "./LinkList";
import { Analytics } from "./Analytics";
import { SocialShare } from "./SocialShare";
import { generateUniqueShortCode } from "@/lib/generators";

interface ProjectDetailsProps {
  project: Project;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [showNewLink, setShowNewLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [projectUrl, setProjectUrl] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const loadLinks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);

      if (data && data.length > 0) {
        const linkIds = data.map((l) => l.id);
        const { count } = await supabase
          .from("link_clicks")
          .select("*", { count: "exact", head: true })
          .in("link_id", linkIds);

        setTotalClicks(count || 0);
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    loadLinks();
    // Set the project URL for sharing
    setProjectUrl(`${window.location.origin}/dashboard/${project.id}`);
  }, [loadLinks, project.id]);

  useEffect(() => {
    if (!links.length) return;
    // Support two formats:
    // 1) ?link_id=<uuid>
    // 2) ?<uuid> (id-only query key with empty value)
    const linkIdFromQuery = searchParams.get("link_id");
    let resolvedId: string | null = linkIdFromQuery;

    if (!resolvedId) {
      const entries = Array.from(searchParams.entries());
      if (entries.length === 1) {
        const [firstKey, value] = entries[0];
        if (value === "") {
          resolvedId = firstKey;
        }
      }
    }

    if (!resolvedId) return;
    const match = links.find((l) => l.id === resolvedId);
    if (match) {
      setSelectedLink(match);
    }
  }, [links, searchParams]);

  // Close the New Link modal on Escape key
  useEffect(() => {
    if (!showNewLink) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNewLink(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNewLink]);

  const handleCreateLink = async (
    title: string,
    destinationUrl: string,
    shortCode: string
  ) => {
    try {
      // Get the next submission number for this project
      const { data: existingLinks, error: countError } = await supabase
        .from("links")
        .select("id")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true });

      if (countError) throw countError;

      const nextSubmissionNumber = `sub${(existingLinks?.length || 0) + 1}`;

      const { data, error } = await supabase
        .from("links")
        .insert({
          project_id: project.id,
          title,
          destination_url: destinationUrl,
          short_code: shortCode,
          submission_number: nextSubmissionNumber,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([data, ...links]);
      setShowNewLink(false);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error creating link");
    }
  };

  const handleSelectLink = (link: Link) => {
    setSelectedLink(link);
    // Write the URL as ?<id> (id-only, no key)
    router.push(`?${link.id}`);
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase.from("links").delete().eq("id", linkId);

      if (error) throw error;

      setLinks(links.filter((l) => l.id !== linkId));
      if (selectedLink?.id === linkId) {
        setSelectedLink(null);
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error deleting link");
    }
  };

  if (selectedLink) {
    return (
      <Analytics
        link={selectedLink}
        onBack={() => {
          setSelectedLink(null);
          // Remove either ?link_id=<id> or ?<id> from the URL
          const params = new URLSearchParams(
            Array.from(searchParams.entries())
          );
          params.delete("link_id");
          // Also delete the id-only key if present
          if (selectedLink?.id) {
            params.delete(selectedLink.id);
          }
          const qs = params.toString();
          router.replace(qs ? `?${qs}` : `/dashboard/${project.id}`);
        }}
        projectSlug={project.slug}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-slate-600 mt-2">{project.description}</p>
              )}
              {/* <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-mono">
                {project.slug}
              </span> */}
            </div>
            <div className="flex items-center space-x-3">
              <SocialShare
                projectName={project.name}
                projectDescription={project.description || undefined}
                projectUrl={projectUrl}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Links</p>
                <p className="text-3xl font-bold text-slate-900">
                  {links.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Clicks</p>
                <p className="text-3xl font-bold text-slate-900">
                  {totalClicks}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Links</p>
                <p className="text-3xl font-bold text-slate-900">
                  {links.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Links</h2>
            <button
              onClick={() => setShowNewLink(!showNewLink)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Link</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-600">
            Loading links...
          </div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
            <Link2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No links yet
            </h3>
            <p className="text-slate-600 mb-6">
              Create your first trackable link for this project
            </p>
            <button
              onClick={() => setShowNewLink(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Create Link</span>
            </button>
          </div>
        ) : (
          <LinkList
            links={links}
            onSelectLink={handleSelectLink}
            onDeleteLink={handleDeleteLink}
            projectSlug={project.slug}
          />
        )}
      </div>

      {showNewLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewLink(false)}
          />
          <div className="relative z-10 w-full max-w-lg mx-4">
            <NewLinkForm
              onSubmit={handleCreateLink}
              onCancel={() => setShowNewLink(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NewLinkForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string, destinationUrl: string, shortCode: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerateShortCode = async () => {
    setIsGeneratingCode(true);
    try {
      const randomCode = await generateUniqueShortCode(supabase);
      setShortCode(randomCode);
    } catch (error) {
      console.error("Error generating short code:", error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Auto-generate short code when title changes (with debounce)
    if (value.trim()) {
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const autoCode = await generateUniqueShortCode(supabase);
          setShortCode(autoCode);
        } catch (error) {
          console.error("Error auto-generating short code:", error);
        }
      }, 500); // 500ms debounce
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, destinationUrl, shortCode);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Create New Link
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Platform Name
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="e.g., Instagram, YouTube, TikTok, Twitter"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            The platform name that will be tracked in analytics
          </p>
        </div>

        <div>
          <label
            htmlFor="destinationUrl"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Destination URL
          </label>
          <input
            id="destinationUrl"
            type="url"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="https://example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="shortCode"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Short Code
          </label>
          <div className="flex space-x-2">
            <input
              id="shortCode"
              type="text"
              value={shortCode}
              readOnly
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
              placeholder="Auto-generated code"
              required
            />
            <button
              type="button"
              onClick={handleGenerateShortCode}
              disabled={isGeneratingCode}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingCode ? "..." : "New"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated when you type a platform name. Click &quot;New&quot;
            for a fresh random code. This field cannot be edited.
          </p>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-medium"
        >
          Create Link
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
