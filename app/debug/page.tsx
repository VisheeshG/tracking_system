"use client";

import { useEffect, useState } from "react";
import { supabase, Project, Link } from "@/lib/supabase";

export default function DebugPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*");

        if (projectsError) {
          console.error("Projects error:", projectsError);
        } else {
          setProjects(projectsData || []);
        }

        // Load links
        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*");

        if (linksError) {
          console.error("Links error:", linksError);
        } else {
          setLinks(linksData || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Projects ({projects.length})
            </h2>
            {projects.length === 0 ? (
              <p className="text-gray-500">No projects found</p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded p-4"
                  >
                    <div className="font-medium text-gray-900">
                      {project.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Slug: {project.slug}
                    </div>
                    <div className="text-sm text-gray-600">
                      ID: {project.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Links ({links.length})
            </h2>
            {links.length === 0 ? (
              <p className="text-gray-500">No links found</p>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="border border-gray-200 rounded p-4"
                  >
                    <div className="font-medium text-gray-900">
                      {link.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      Short Code: {link.short_code}
                    </div>
                    <div className="text-sm text-gray-600">
                      Project ID: {link.project_id}
                    </div>
                    <div className="text-sm text-gray-600">
                      URL: {link.destination_url}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test URLs
          </h2>
          {projects.length > 0 && links.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-600">
                Try these URLs (replace [creator] and [submission] with actual
                values):
              </p>
              {projects.map((project) =>
                links
                  .filter((link) => link.project_id === project.id)
                  .map((link) => (
                    <div
                      key={link.id}
                      className="font-mono text-sm bg-gray-100 p-2 rounded"
                    >
                      <a
                        href={`/${project.slug}/${link.short_code}/[creator]/[submission]`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        http://localhost:3000/{project.slug}/{link.short_code}
                        /[creator]/[submission]
                      </a>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
