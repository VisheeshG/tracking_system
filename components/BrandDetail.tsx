"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Brand, Project } from "@/lib/supabase";
import { DashboardStatsCards } from "./DashboardStatsCards";
import { ProjectList, ProjectWithStats } from "./ProjectList";
import { TitleSearchBar } from "./TitleSearchBar";
import { NewProjectForm } from "./NewProjectForm";
import { BrandAnalyticsPanel } from "./BrandAnalyticsPanel";
import { matchesTitleQuery } from "@/lib/search";
import {
  fetchStatsForProjectIds,
  fetchStatsMapForProjectIds,
} from "@/lib/project-stats";
import { ArrowLeft, Plus, Briefcase, Pencil } from "lucide-react";
import toast from "react-hot-toast";

interface BrandDetailProps {
  brandId: string;
}

export function BrandDetail({ brandId }: BrandDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalLinks, setTotalLinks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  const brandProjects = useMemo(
    () => projects.filter((p) => p.brand_id === brandId),
    [projects, brandId]
  );

  const [projectStatsMap, setProjectStatsMap] = useState<
    Record<string, { linkCount: number; clickCount: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    const ids = brandProjects.map((p) => p.id);

    if (ids.length === 0) {
      setProjectStatsMap({});
      return;
    }

    void fetchStatsMapForProjectIds(ids).then((map) => {
      if (!cancelled) setProjectStatsMap(map);
    });

    return () => {
      cancelled = true;
    };
  }, [brandProjects]);

  const filteredProjectsWithStats = useMemo((): ProjectWithStats[] => {
    return brandProjects
      .filter((p) => matchesTitleQuery(projectSearch, p.name))
      .map((p) => ({
        ...p,
        linkCount: projectStatsMap[p.id]?.linkCount ?? 0,
        clickCount: projectStatsMap[p.id]?.clickCount ?? 0,
      }));
  }, [brandProjects, projectSearch, projectStatsMap]);

  const loadData = useCallback(async () => {
    if (!user) return;

    setStatsLoading(true);
    try {
      const [brandRes, brandsRes, projectsRes] = await Promise.all([
        supabase
          .from("brands")
          .select("*")
          .eq("id", brandId)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("brands")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (brandRes.error) throw brandRes.error;
      if (brandsRes.error) throw brandsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setBrand(brandRes.data);
      setEditName(brandRes.data.name);
      setBrands(brandsRes.data || []);
      const allProjects = (projectsRes.data || []).map((p) => ({
        ...p,
        brand_id: p.brand_id ?? null,
      }));
      setProjects(allProjects);

      const ids = allProjects
        .filter((p) => p.brand_id === brandId)
        .map((p) => p.id);
      const stats = await fetchStatsForProjectIds(ids);
      setTotalLinks(stats.linkCount);
      setTotalClicks(stats.clickCount);
    } catch (error) {
      console.error("Error loading brand:", error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [user, brandId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveName = async () => {
    if (!brand || !user) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Brand name is required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("brands")
        .update({ name: trimmed })
        .eq("id", brand.id)
        .select()
        .single();

      if (error) throw error;
      setBrand(data);
      setIsEditingName(false);
      toast.success("Brand updated");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error updating brand"
      );
    }
  };

  const handleCreateProject = async (
    name: string,
    description: string,
    slug: string,
    selectedBrandId: string | null
  ) => {
    if (!user) return false;

    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Project name is required");
        return false;
      }

      const { data: existingProjects, error: existingError } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", trimmedName);

      if (existingError) throw existingError;
      if (existingProjects && existingProjects.length > 0) {
        toast.error("A project with this name already exists.");
        return false;
      }

      const trimmedSlug = slug.trim();
      const { data: existingSlug } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", trimmedSlug)
        .single();

      if (existingSlug) {
        toast.error(`Project slug "${trimmedSlug}" is already taken.`);
        return false;
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: trimmedName,
          description: description.trim() || null,
          slug: trimmedSlug,
          brand_id: selectedBrandId ?? brandId,
        })
        .select()
        .single();

      if (error) throw error;

      const normalized = { ...data, brand_id: data.brand_id ?? null };
      setProjects([normalized, ...projects]);
      setShowNewProject(false);
      await loadData();
      router.push(`/dashboard/${data.id}`);
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error creating project"
      );
      return false;
    }
  };

  const handleMoveToBrand = async (
    projectId: string,
    targetBrandId: string | null
  ) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ brand_id: targetBrandId })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      if (targetBrandId !== brandId) {
        router.push("/dashboard");
        toast.success(
          targetBrandId ? "Project moved" : "Project moved to Unbranded"
        );
        return;
      }

      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, brand_id: data.brand_id ?? null }
            : p
        )
      );
      await loadData();
      toast.success("Project updated");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error moving project"
      );
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("You must be signed in to delete a project");
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Error deleting project"
        );
      }

      setProjects(projects.filter((p) => p.id !== projectId));
      await loadData();
      toast.success("Project deleted");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error deleting project"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Loading brand...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Brand not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-violet-600 font-semibold hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold border-2 border-violet-300 rounded-lg px-2 py-1 max-w-full"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 bg-violet-600 text-white text-sm rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(brand.name);
                    }}
                    className="px-3 py-1 bg-slate-100 text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
                    {brand.name}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg"
                    aria-label="Edit brand name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500 mt-1 font-mono">
                linkto.in/{brand.slug}/…
              </p>
              {brand.description && (
                <p className="text-slate-600 mt-1">{brand.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
        <DashboardStatsCards
          totalProjects={brandProjects.length}
          totalLinks={totalLinks}
          totalClicks={totalClicks}
          loading={statsLoading}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Projects</h2>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {brandProjects.length > 0 && (
          <TitleSearchBar
            value={projectSearch}
            onChange={setProjectSearch}
            placeholder="Search projects in this brand..."
            className="mb-6 max-w-md"
          />
        )}

        {brandProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center mb-10">
            <p className="text-slate-600 mb-4">No projects in this brand yet.</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="text-blue-600 font-semibold hover:underline"
            >
              Create a project
            </button>
          </div>
        ) : filteredProjectsWithStats.length === 0 ? (
          <p className="text-slate-600 mb-10">No projects match your search.</p>
        ) : (
          <div className="mb-10">
            <ProjectList
              projects={filteredProjectsWithStats}
              brands={brands}
              onSelectProject={(p) => router.push(`/dashboard/${p.id}`)}
              onDeleteProject={handleDeleteProject}
              onMoveToBrand={handleMoveToBrand}
            />
          </div>
        )}

        <BrandAnalyticsPanel
          projectIds={brandProjects.map((p) => p.id)}
          projects={brandProjects}
          brandSlug={brand.slug}
        />
      </main>

      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="clickable-backdrop absolute inset-0 bg-black/60"
            onClick={() => setShowNewProject(false)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <NewProjectForm
              brands={brands}
              defaultBrandId={brandId}
              onSubmit={handleCreateProject}
              onCancel={() => setShowNewProject(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
