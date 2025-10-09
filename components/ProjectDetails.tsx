"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
import { generateUniqueProjectShortCode } from "@/lib/generators";
import toast from "react-hot-toast";

interface ProjectDetailsProps {
  project: Project;
}

function ProjectDetailsContent({ project }: ProjectDetailsProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [showNewLink, setShowNewLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [platformCount, setPlatformCount] = useState(0);
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

        // Calculate unique platforms
        const uniquePlatforms = new Set(data.map((l) => l.platform));
        setPlatformCount(uniquePlatforms.size);
      } else {
        setPlatformCount(0);
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    loadLinks();
    // Set the project URL for sharing (public view by slug)
    setProjectUrl(`${window.location.origin}/${project.slug}`);
  }, [loadLinks, project.id, project.slug]);

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
    linkTitle: string,
    platform: string,
    destinationUrl: string,
    shortCode: string
  ) => {
    try {
      // Check if destination URL already exists in this project
      const { data: existingUrl, error: urlCheckError } = await supabase
        .from("links")
        .select("id, destination_url, link_title")
        .eq("project_id", project.id)
        .eq("destination_url", destinationUrl)
        .single();

      if (urlCheckError && urlCheckError.code !== "PGRST116") {
        throw urlCheckError;
      }

      if (existingUrl) {
        toast.error(
          `This destination URL already exists in this project as "${existingUrl.link_title}". Please use a different URL.`
        );
        return false;
      }

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
          link_title: linkTitle,
          platform,
          destination_url: destinationUrl,
          short_code: shortCode,
          submission_number: nextSubmissionNumber,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([data, ...links]);
      setShowNewLink(false);
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error creating link"
      );
      return false;
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
      toast.error(
        error instanceof Error ? error.message : "Error deleting link"
      );
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-2 text-sm sm:text-base text-slate-600 hover:text-slate-900 mb-3 sm:mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  {project.description}
                </p>
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
                className="mt-0 sm:mt-2"
              />
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
                  Total Links
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {links.length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">
                  Total Clicks
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {totalClicks}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">
                  Platforms
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {platformCount}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Links
            </h2>
            <button
              onClick={() => setShowNewLink(!showNewLink)}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition font-medium w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span>New Link</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm sm:text-base text-slate-600">
            Loading links...
          </div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 sm:p-8 lg:p-12 text-center">
            <Link2 className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
              No links yet
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewLink(false)}
          />
          <div className="relative z-10 w-full max-w-lg">
            <NewLinkForm
              onSubmit={handleCreateLink}
              onCancel={() => setShowNewLink(false)}
              projectId={project.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-600">Loading...</div>
        </div>
      }
    >
      <ProjectDetailsContent project={project} />
    </Suspense>
  );
}

function NewLinkForm({
  onSubmit,
  onCancel,
  projectId,
}: {
  onSubmit: (
    linkTitle: string,
    platform: string,
    destinationUrl: string,
    shortCode: string
  ) => Promise<boolean>;
  onCancel: () => void;
  projectId: string;
}) {
  const [linkTitle, setLinkTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlatformChange = (value: string) => {
    setPlatform(value);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Auto-generate short code when platform changes (with debounce)
    if (value.trim()) {
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const projectCode = await generateUniqueProjectShortCode(
            supabase,
            projectId
          );
          setShortCode(projectCode);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    // Validate that shortCode is not empty
    if (!shortCode.trim()) {
      toast.error(
        "Please wait for the short code to be generated before submitting."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(linkTitle, platform, destinationUrl, shortCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6"
    >
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
        Create New Link
      </h3>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label
            htmlFor="linkTitle"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Link Title
          </label>
          <input
            id="linkTitle"
            type="text"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="title"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            A descriptive title for this link
          </p>
        </div>

        <div>
          <label
            htmlFor="platform"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Platform Name
          </label>
          <input
            id="platform"
            type="text"
            value={platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Destination URL
          </label>
          <input
            id="destinationUrl"
            type="url"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="https://example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="shortCode"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Short Code
          </label>
          <input
            id="shortCode"
            type="text"
            value={shortCode}
            readOnly
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
            placeholder="Auto-generated code"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated when you type a platform name. This short code will
            be shared across all links in this project. This field cannot be
            edited.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-2.5 text-sm sm:text-base rounded-lg transition font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Link"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg transition font-medium disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
