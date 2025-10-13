"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, Project, Link } from "@/lib/supabase";
import { LinkList } from "@/components/LinkList";
import { Analytics } from "@/components/Analytics";
import { PasswordVerificationModal } from "@/components/PasswordVerificationModal";

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

  const projectSlug = params.projectSlug as string;

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
        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false });

        if (linksError) {
          setError("Failed to load links");
          return;
        }

        setLinks(linksData || []);

        // If URL has ?link_id=uuid, preselect that link
        const search = new URLSearchParams(window.location.search);
        const qId = search.get("link_id");
        if (qId && linksData) {
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
        {links.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No links yet
            </h3>
            <p className="text-slate-600">This project has no public links.</p>
          </div>
        ) : (
          <LinkList
            links={links}
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
      </div>
    </div>
  );
}
