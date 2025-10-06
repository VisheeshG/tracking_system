"use client";

import { Project } from "@/lib/supabase";
import { FolderOpen, Trash2 } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectList({
  projects,
  onSelectProject,
  onDeleteProject,
}: ProjectListProps) {
  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this project? This will also delete all associated links and analytics data."
      )
    ) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onSelectProject(project)}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
            <button
              onClick={(e) => handleDelete(e, project.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition">
            {project.name}
          </h3>

          {project.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {/* <span className="text-xs text-slate-500 font-mono">{project.slug}</span> */}
            {/* <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" /> */}
          </div>
        </div>
      ))}
    </div>
  );
}
