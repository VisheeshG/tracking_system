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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition flex-shrink-0">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <button
                onClick={(e) => handleDelete(e, project.id, project.name)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-100 sm:opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition break-words">
              {project.name}
            </h3>

            {project.description && (
              <p className="text-sm text-slate-600 mb-3 sm:mb-4 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">
                  Slug:
                </span>
                <span className="text-sm text-blue-600 font-mono font-semibold bg-blue-50 px-2 py-1 rounded">
                  {project.slug}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelDelete}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Delete Project
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteConfirm.projectName}</span>
              ? This will also delete all associated links and analytics data.
              This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={confirmDelete}
                className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition font-medium"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition font-medium"
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
