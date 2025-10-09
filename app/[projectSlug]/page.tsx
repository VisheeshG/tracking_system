"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, Project, Link } from "@/lib/supabase";
import { LinkList } from "@/components/LinkList";
import { Analytics } from "@/components/Analytics";

export default function PublicProjectPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectSlug = params.projectSlug as string;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("slug", projectSlug)
          .single();

        if (projectError || !projectData) {
          setError("Project not found");
          return;
        }

        setProject(projectData);

        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .eq("project_id", projectData.id)
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
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    if (projectSlug) load();
  }, [projectSlug]);

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
