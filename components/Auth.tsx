"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export function Auth({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signUp, signIn, signOut } = useAuth();

  useEffect(() => {
    // Keep local state in sync if parent changes mode prop
    setIsSignUp(mode === "signup");
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        // Show success toast
        toast.success("Account created successfully! Please sign in.", {
          duration: 4000,
        });

        // Ensure no active session after signup so user sees login
        await signOut();
        // Wait a bit for auth state to clear before redirecting
        await new Promise((resolve) => setTimeout(resolve, 100));
        router.push("/");
        return;
      }

      const { error } = await signIn(email, password);
      if (error) throw error;

      // Show success toast
      toast.success("Welcome back! Logged in successfully.", {
        duration: 3000,
      });

      // After successful login, navigate to dashboard without leaving login in history
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
              {isSignUp ? (
                <UserPlus className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-slate-600 mt-2">
              {isSignUp
                ? "Start tracking your links today"
                : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            {isSignUp ? (
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                  // Navigate to login route for clarity
                  router.push("/");
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                  // Navigate to signup route
                  router.push("/signup");
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Don&apos;t have an account? Sign up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
