'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Auth } from '@/components/Auth';
import { Dashboard } from '@/components/Dashboard';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard />;
}
