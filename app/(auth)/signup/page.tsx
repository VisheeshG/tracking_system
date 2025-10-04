"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/components/Auth";

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Remove automatic redirect - let users see signup form even if logged in
  // They can manually navigate to dashboard if they want
  // Update: If already authenticated, do not allow seeing signup; redirect with replace
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return <Auth mode="signup" />;
}
