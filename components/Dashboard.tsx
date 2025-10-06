"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Project } from "@/lib/supabase";
import { ProjectList } from "./ProjectList";
import { generateUniqueProjectSlug } from "@/lib/generators";
import { LogOut, Plus, FolderOpen } from "lucide-react";

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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name,
          description,
          slug,
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setShowNewProject(false);
      // Navigate to the new project
      router.push(`/dashboard/${data.id}`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error creating project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error deleting project");
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Link Tracker
                </h1>
                <p className="text-sm text-slate-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Your Projects
              </h2>
              <p className="text-slate-600 mt-1">
                Create and manage your link tracking campaigns
              </p>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
            <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No projects yet
            </h3>
            <p className="text-slate-600 mb-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewProject(false)}
          />
          <div className="relative z-10 w-full max-w-lg mx-4">
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
  onSubmit: (name: string, description: string, slug: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, description, slug);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Create New Project
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="e.g., Website Campaign, App Launch"
            required
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Project Slug
          </label>
          <div className="flex space-x-2">
            <input
              id="slug"
              type="text"
              value={slug}
              readOnly
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
              placeholder="Auto-generated letter"
              required
            />
            <button
              type="button"
              onClick={handleGenerateSlug}
              disabled={isGeneratingSlug}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingSlug ? "..." : "New"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated single letter when you type a project name. Click
            &quot;New&quot; for a fresh random letter. This field cannot be
            edited.
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={3}
            placeholder="Brief description of this project"
          />
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-medium"
        >
          Create Project
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
