import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import type { Profile } from './profile';
import { supabase } from './supabase';

export function useProfile() {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (authLoading) return;
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [authLoading, session?.user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading: authLoading || loading, refetch };
}
