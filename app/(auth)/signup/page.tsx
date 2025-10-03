"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/components/Auth";

export default function SignupPage() {
  const { loading } = useAuth();

  // Remove automatic redirect - let users see signup form even if logged in
  // They can manually navigate to dashboard if they want

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return <Auth mode="signup" />;
}
