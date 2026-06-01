"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BrandDetail } from "@/components/BrandDetail";

export default function BrandPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Loading...</p>
      </div>
    );
  }

  return <BrandDetail brandId={brandId} />;
}
