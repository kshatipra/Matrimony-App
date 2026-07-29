import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import { supabase } from './supabase';

export type Subscription = {
  user_id: string;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  plan: 'free' | 'paid';
  status: 'inactive' | 'active' | 'past_due' | 'canceled';
  current_period_end: string | null;
};

export function useSubscription() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', session.user.id).maybeSingle();
    setSubscription(data as Subscription | null);
    setLoading(false);
  }, [session?.user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isActive =
    subscription?.status === 'active' &&
    subscription?.plan === 'paid' &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

  return { subscription, isActive, loading, refetch };
}
