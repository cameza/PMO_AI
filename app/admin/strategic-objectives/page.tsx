'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { StrategicObjectivesAdmin } from '@/components/StrategicObjectivesAdmin';

export default function StrategicObjectivesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep p-6">
      <div className="max-w-4xl mx-auto">
        <StrategicObjectivesAdmin />
      </div>
    </div>
  );
}
