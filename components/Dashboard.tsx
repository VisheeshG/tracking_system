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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const handleSelectProject = (project: Project) => {
    router.push(`/dashboard/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Link Tracker
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 truncate max-w-[200px] sm:max-w-none">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Your Projects
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Create and manage your link tracking campaigns
              </p>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition font-medium w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 sm:p-8 lg:p-12 text-center">
            <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
              No projects yet
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
              Create your first project to start tracking links
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewProject(false)}
          />
          <div className="relative z-10 w-full max-w-lg">
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
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6"
    >
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
        Create New Project
      </h3>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="e.g., Website Campaign, App Launch"
            required
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Project Slug
          </label>
          <div className="flex space-x-2">
            <input
              id="slug"
              type="text"
              value={slug}
              readOnly
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
              placeholder="Auto-generated letter"
              required
            />
            <button
              type="button"
              onClick={handleGenerateSlug}
              disabled={isGeneratingSlug}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={3}
            placeholder="Brief description of this project"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-2.5 text-sm sm:text-base rounded-lg transition font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Project"}
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
