"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase, Project, Link } from "@/lib/supabase";
import {
  countClicksForLinkIds,
  fetchAllLinksForProjectId,
} from "@/lib/supabase-pagination";
import { LinkList } from "@/components/LinkList";
import { TitleSearchBar } from "@/components/TitleSearchBar";
import { matchesTitleQuery } from "@/lib/search";
import { Analytics } from "@/components/Analytics";
import { PasswordVerificationModal } from "@/components/PasswordVerificationModal";
import { Link2, MousePointerClick, TrendingUp } from "lucide-react";

export default function PublicProjectPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [platformCount, setPlatformCount] = useState(0);
  const [linkSearch, setLinkSearch] = useState("");

  const projectSlug = params.projectSlug as string;

  const filteredLinks = useMemo(
    () => links.filter((l) => matchesTitleQuery(linkSearch, l.link_title)),
    [links, linkSearch]
  );

  // Load project info and check password requirement on mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, load the project basic info (needed for password modal)
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("slug", projectSlug)
          .single();

        if (projectError || !projectData) {
          setError("Project not found");
          setCheckingAuth(false);
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Check if project requires password
        const response = await fetch(
          `/api/verify-project-password?project_slug=${projectSlug}`
        );

        if (!response.ok) {
          setError("Project not found");
          setCheckingAuth(false);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setRequiresPassword(data.hasPasswords);

        // Check if already authenticated from localStorage
        if (data.hasPasswords) {
          const storedAuth = localStorage.getItem(
            `project_auth_${projectSlug}`
          );
          if (storedAuth) {
            try {
              const authData = JSON.parse(storedAuth);
              // Check if auth is still valid (not expired)
              const expiresAt = new Date(authData.expiresAt);
              if (expiresAt > new Date()) {
                // Validate that the password still exists in the database
                if (authData.passwordId) {
                  const validateResponse = await fetch(
                    `/api/verify-project-password?project_slug=${projectSlug}&password_id=${authData.passwordId}`
                  );

                  if (validateResponse.ok) {
                    const validateData = await validateResponse.json();
                    if (validateData.valid) {
                      setIsAuthenticated(true);
                    } else {
                      // Password was deleted, clear localStorage
                      localStorage.removeItem(`project_auth_${projectSlug}`);
                      setIsAuthenticated(false);
                    }
                  } else {
                    localStorage.removeItem(`project_auth_${projectSlug}`);
                    setIsAuthenticated(false);
                  }
                } else {
                  // Old format without passwordId, keep for backward compatibility
                  setIsAuthenticated(true);
                }
              } else {
                localStorage.removeItem(`project_auth_${projectSlug}`);
                setIsAuthenticated(false);
              }
            } catch {
              localStorage.removeItem(`project_auth_${projectSlug}`);
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(true); // No password required
        }
      } catch (err) {
        console.error("Error during initialization:", err);
        setError("Failed to load project");
      } finally {
        setCheckingAuth(false);
        setLoading(false);
      }
    };

    if (projectSlug) {
      init();
    }
  }, [projectSlug]);

  // Load links when authenticated
  useEffect(() => {
    const loadLinks = async () => {
      if (!project) return;

      try {
        setLoading(true);
        const linksData = await fetchAllLinksForProjectId(supabase, project.id);
        setLinks(linksData);

        if (linksData.length > 0) {
          const linkIds = linksData.map((l) => l.id);
          const clickCount = await countClicksForLinkIds(supabase, linkIds);
          setTotalClicks(clickCount);
          setPlatformCount(new Set(linksData.map((l) => l.platform)).size);
        } else {
          setTotalClicks(0);
          setPlatformCount(0);
        }

        // If URL has ?link_id=uuid, preselect that link
        const search = new URLSearchParams(window.location.search);
        const qId = search.get("link_id");
        if (qId && linksData.length > 0) {
          const match = linksData.find((l) => l.id === qId);
          if (match) setSelectedLinkId(match.id);
        }
      } catch {
        setError("Failed to load links");
      } finally {
        setLoading(false);
      }
    };

    // Only load links if authenticated and auth check is complete
    if (project && isAuthenticated && !checkingAuth) {
      loadLinks();
    }
  }, [project, isAuthenticated, checkingAuth]);

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/verify-project-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_slug: projectSlug,
          password,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        // Store authentication in localStorage with expiration (24 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        localStorage.setItem(
          `project_auth_${projectSlug}`,
          JSON.stringify({
            accessToken: data.accessToken,
            passwordId: data.passwordId,
            expiresAt: expiresAt.toISOString(),
          })
        );

        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (err) {
      console.error("Password verification error:", err);
      return false;
    }
  };

  // Show loading only during initial check
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Show password modal if required and not authenticated
  if (requiresPassword && !isAuthenticated && project) {
    return (
      <PasswordVerificationModal
        projectName={project.name}
        projectSlug={projectSlug}
        onVerify={handlePasswordVerify}
      />
    );
  }

  // Show loading while fetching links (after authentication)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Project Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "The requested project could not be found."}
          </p>
          {/* <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button> */}
        </div>
      </div>
    );
  }

  const selectedLink = selectedLinkId
    ? links.find((l) => l.id === selectedLinkId) || null
    : null;

  if (selectedLink) {
    return (
      <Analytics
        link={selectedLink}
        projectSlug={project.slug}
        onBack={() => {
          setSelectedLinkId(null);
          const url = new URL(window.location.href);
          url.searchParams.delete("link_id");
          window.history.replaceState({}, "", url.toString());
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
          {project.description && (
            <p className="text-slate-600 mt-2">{project.description}</p>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/60 p-4 sm:p-6 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">
                  Total Links
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {links.length}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Link2 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/60 p-4 sm:p-6 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">
                  Total Clicks
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {totalClicks}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/60 p-4 sm:p-6 transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">
                  Platforms
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {platformCount}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {links.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No links yet
            </h3>
            <p className="text-slate-600">This project has no public links.</p>
          </div>
        ) : (
          <>
            <TitleSearchBar
              value={linkSearch}
              onChange={setLinkSearch}
              placeholder="Search links by title..."
              className="mb-6 max-w-md"
            />
            {filteredLinks.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                <p className="text-slate-600">
                  No links match &quot;{linkSearch.trim()}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setLinkSearch("")}
                  className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <LinkList
                links={filteredLinks}
                onSelectLink={(link) => {
                  setSelectedLinkId(link.id);
                  const url = new URL(window.location.href);
                  url.searchParams.set("link_id", link.id);
                  window.history.replaceState({}, "", url.toString());
                }}
                onDeleteLink={() => {}}
                projectSlug={project.slug}
                readOnly
                enableSelectInReadOnly
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
