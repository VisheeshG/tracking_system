"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Project } from "@/lib/supabase";
import { ProjectList } from "./ProjectList";
import { generateUniqueProjectSlug } from "@/lib/generators";
import { LogOut, Plus, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";

export function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [user, loadProjects]);

  // Close the New Project modal on Escape key
  useEffect(() => {
    if (!showNewProject) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNewProject(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNewProject]);

  const handleCreateProject = async (
    name: string,
    description: string,
    slug: string
  ) => {
    if (!user) return false;

    try {
      // Prevent duplicate project names per user (case-insensitive)
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

      // Check if slug already exists (across all users)
      const { data: existingSlug, error: slugError } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!slugError && existingSlug) {
        toast.error(
          `Project slug "${slug}" is already taken. Click "New" to generate a different one.`,
          { duration: 5000 }
        );
        return false;
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: trimmedName,
          description,
          slug,
        })
        .select()
        .single();

      if (error) {
        // Check if error is due to duplicate slug constraint
        if (error.code === "23505" && error.message.includes("slug")) {
          toast.error(
            `Project slug "${slug}" is already taken. Click "New" to generate a different one.`,
            { duration: 5000 }
          );
          return false;
        }
        throw error;
      }

      setProjects([data, ...projects]);
      setShowNewProject(false);
      // Navigate to the new project
      router.push(`/dashboard/${data.id}`);
      return true;
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error creating project"
      );
      return false;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      console.log("Starting deletion for project:", projectId);

      // First, get all links for this project
      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id")
        .eq("project_id", projectId);

      if (linksError) {
        console.error("Error fetching links:", linksError);
        throw linksError;
      }

      console.log(`Found ${links?.length || 0} links for project`);

      // Delete all link_clicks for each link
      if (links && links.length > 0) {
        const linkIds = links.map((link) => link.id);
        console.log("Deleting link_clicks for link IDs:", linkIds);

        const { error: clicksError, count: clicksCount } = await supabase
          .from("link_clicks")
          .delete({ count: "exact" })
          .in("link_id", linkIds);

        if (clicksError) {
          console.error("Error deleting link_clicks:", clicksError);
          throw clicksError;
        }
        console.log(`Deleted ${clicksCount} link_clicks`);

        // Delete all links for this project
        console.log("Deleting links for project:", projectId);
        const { error: deleteLinksError, count: linksCount } = await supabase
          .from("links")
          .delete({ count: "exact" })
          .eq("project_id", projectId);

        if (deleteLinksError) {
          console.error("Error deleting links:", deleteLinksError);
          throw deleteLinksError;
        }
        console.log(`Deleted ${linksCount} links`);
      }

      // Delete all project passwords
      console.log("Deleting project passwords for project:", projectId);
      const { error: passwordsError, count: passwordsCount } = await supabase
        .from("project_passwords")
        .delete({ count: "exact" })
        .eq("project_id", projectId);

      if (passwordsError) {
        console.error("Error deleting passwords:", passwordsError);
        throw passwordsError;
      }
      console.log(`Deleted ${passwordsCount} project_passwords`);

      // Finally, delete the project itself
      console.log("Deleting project:", projectId);
      const { error, count: projectCount } = await supabase
        .from("projects")
        .delete({ count: "exact" })
        .eq("id", projectId);

      if (error) {
        console.error("Error deleting project:", error);
        throw error;
      }
      console.log(`Deleted ${projectCount} project(s)`);

      setProjects(projects.filter((p) => p.id !== projectId));
      toast.success("Project and all associated data deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting project:", error);
      toast.error(
        error instanceof Error ? error.message : "Error deleting project"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 animate-pulse shadow-lg">
            <FolderOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-700 font-semibold text-lg">
            Loading dashboard...
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Please wait while we fetch your projects
          </p>
        </div>
      </div>
    );
  }

  const handleSelectProject = (project: Project) => {
    router.push(`/dashboard/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Link Tracker
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 truncate max-w-[200px] sm:max-w-none font-medium">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="group flex items-center space-x-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Your Projects
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                Create and manage your link tracking campaigns
              </p>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 sm:px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl w-full sm:w-auto hover:scale-105"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-12 lg:p-16 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mb-6">
              <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              No projects yet
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto">
              Create your first project to start tracking links and analyzing
              your campaign performance
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="group inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          <ProjectList
            projects={projects}
            onSelectProject={handleSelectProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </main>

      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewProject(false)}
          />
          <div className="relative z-10 w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300">
            <NewProjectForm
              onSubmit={handleCreateProject}
              onCancel={() => setShowNewProject(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NewProjectForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (
    name: string,
    description: string,
    slug: string
  ) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerateSlug = async () => {
    setIsGeneratingSlug(true);
    try {
      const randomSlug = await generateUniqueProjectSlug(supabase);
      setSlug(randomSlug);
    } catch (error) {
      console.error("Error generating slug:", error);
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Auto-generate slug when name changes (with debounce)
    if (value.trim()) {
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const autoSlug = await generateUniqueProjectSlug(supabase);
          setSlug(autoSlug);
        } catch (error) {
          console.error("Error auto-generating slug:", error);
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

    // Validate that slug is not empty
    if (!slug.trim()) {
      toast.error(
        "Please wait for the project slug to be generated before submitting."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(name, description, slug);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-4 sm:p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Create New Project
          </h3>
          <p className="text-xs text-slate-600">
            Set up a new tracking campaign
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-bold text-slate-700 mb-1.5"
          >
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-3 text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g., Website Campaign, App Launch"
            required
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-bold text-slate-700 mb-1.5"
          >
            Project Slug
          </label>
          <div className="flex space-x-2">
            <input
              id="slug"
              type="text"
              value={slug}
              readOnly
              className="flex-1 px-3 py-3 text-base border-2 border-slate-300 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed font-mono"
              placeholder="Auto-generated letter"
              required
            />
            <button
              type="button"
              onClick={handleGenerateSlug}
              disabled={isGeneratingSlug}
              className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isGeneratingSlug ? "..." : "New"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated when you type a project name (starts with single
            letters like &quot;a&quot;, then &quot;a12&quot;, then
            &quot;ab1&quot;, etc.). Click &quot;New&quot; if already taken.
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-bold text-slate-700 mb-1.5"
          >
            Description{" "}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-3 text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
            rows={2}
            placeholder="Brief description of this project"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 text-sm rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
        >
          {isSubmitting ? "Creating..." : "Create Project"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-sm rounded-xl transition-all font-semibold disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 shadow-sm hover:shadow-md"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
