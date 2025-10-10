"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Shield, X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface ProjectPassword {
  id: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface ProjectPasswordManagerProps {
  projectId: string;
  accessToken: string;
  onClose?: () => void;
}

export function ProjectPasswordManager({
  projectId,
  accessToken,
  onClose,
}: ProjectPasswordManagerProps) {
  const [passwords, setPasswords] = useState<ProjectPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  const loadPasswords = async () => {
    try {
      const response = await fetch(
        `/api/project-passwords?project_id=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load passwords");
      }

      const data = await response.json();
      setPasswords(data.passwords || []);
    } catch (error) {
      console.error("Error loading passwords:", error);
      toast.error("Failed to load passwords");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load passwords if we have an access token
    if (accessToken) {
      loadPasswords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, accessToken]);

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/project-passwords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          password: newPassword,
          description: newDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create password");
      }

      const data = await response.json();
      setPasswords([data.password, ...passwords]);
      setNewPassword("");
      setNewDescription("");
      setShowNewPassword(false);
      setShowPasswordText(false);
      toast.success("Password created successfully");
    } catch (error) {
      console.error("Error creating password:", error);
      toast.error("Failed to create password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePassword = async (passwordId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this password? Anyone using this password will lose access."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/project-passwords?id=${passwordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete password");
      }

      setPasswords(passwords.filter((p) => p.id !== passwordId));
      toast.success("Password deleted successfully");
    } catch (error) {
      console.error("Error deleting password:", error);
      toast.error("Failed to delete password");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Access Passwords
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Manage who can view this project&apos;s analytics
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {showNewPassword && (
        <form
          onSubmit={handleCreatePassword}
          className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200"
        >
          <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">
            Create New Password
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Enter a secure password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  disabled={isSubmitting}
                  title={showPasswordText ? "Hide password" : "Show password"}
                >
                  {showPasswordText ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="e.g., For brand partner, For investor"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 mt-1">
                Help remember who this password is for
              </p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition text-sm sm:text-base disabled:bg-purple-400"
            >
              {isSubmitting ? "Creating..." : "Create Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewPassword(false);
                setNewPassword("");
                setNewDescription("");
                setShowPasswordText(false);
              }}
              disabled={isSubmitting}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg transition text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
          <p className="text-sm sm:text-base text-slate-600">
            Loading passwords...
          </p>
        </div>
      ) : passwords.length === 0 ? (
        <div className="text-center py-8">
          <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-slate-600 mb-2">
            No passwords created yet
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            Create passwords to control who can view this project
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {passwords.map((password) => (
            <div
              key={password.id}
              className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm sm:text-base truncate">
                    {password.description || "Untitled Password"}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Created {new Date(password.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeletePassword(password.id)}
                className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                title="Delete password"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-blue-900 font-medium mb-1">
              How it works
            </p>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• Create multiple passwords for the same shared link</li>
              {/* <li>• Each password acts as a unique access key</li> */}
              <li>• Delete a password to revoke access for that person</li>
              <li>• Other passwords continue to work independently</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
