"use client";

import { useState } from "react";
import { Project } from "@/lib/supabase";
import { FolderOpen, Trash2, AlertTriangle } from "lucide-react";

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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    projectId: string | null;
    projectName: string | null;
  }>({ show: false, projectId: null, projectName: null });

  const handleDelete = (
    e: React.MouseEvent,
    projectId: string,
    projectName: string
  ) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, projectId, projectName });
  };

  const confirmDelete = () => {
    if (deleteConfirm.projectId) {
      onDeleteProject(deleteConfirm.projectId);
      setDeleteConfirm({ show: false, projectId: null, projectName: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, projectId: null, projectName: null });
  };

  return (
    <>
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
                onClick={(e) => handleDelete(e, project.id, project.name)}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelDelete}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Delete Project
              </h3>
            </div>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteConfirm.projectName}</span>
              ? This will also delete all associated links and analytics data.
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition font-medium"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
