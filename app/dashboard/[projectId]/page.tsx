"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Project } from "@/lib/supabase";
import { ProjectDetails } from "@/components/ProjectDetails";

export default function ProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;

  useEffect(() => {
    if (!loading && !user && projectId) {
      (async () => {
        try {
          // If not authenticated, redirect to public project slug page
          const { data: publicProject } = await supabase
            .from("projects")
            .select("slug")
            .eq("id", projectId)
            .single();

          if (publicProject?.slug) {
            router.replace(`/${publicProject.slug}`);
          } else {
            router.replace("/");
          }
        } catch {
          router.replace("/");
        }
      })();
    }
  }, [loading, user, router, projectId]);

  useEffect(() => {
    const loadProject = async () => {
      if (!user || !projectId) return;

      try {
        setProjectLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error loading project:", error);
          setError("Project not found");
          return;
        }

        if (!data) {
          setError("Project not found");
          return;
        }

        setProject(data);
      } catch (err) {
        console.error("Error loading project:", err);
        setError("Failed to load project");
      } finally {
        setProjectLoading(false);
      }
    };

    if (user && projectId) {
      loadProject();
    }
  }, [user, projectId]);

  if (loading || projectLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
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
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <ProjectDetails project={project} />;
}
