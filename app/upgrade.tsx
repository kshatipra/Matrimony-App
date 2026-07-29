import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { useSubscription } from '../lib/useSubscription';
import { supabase } from '../lib/supabase';

export default function Upgrade() {
  const { subscription, isActive, loading, refetch } = useSubscription();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  async function startCheckout() {
    setStarting(true);
    setError('');
    const { data, error: fnError } = await supabase.functions.invoke('create-subscription');
    setStarting(false);
    if (fnError || !data?.short_url) {
      setError(fnError?.message ?? 'Could not start checkout.');
      return;
    }
    Linking.openURL(data.short_url);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-rose-600">
        {isActive ? "You're subscribed" : 'Unlock full access'}
      </Text>

      {isActive ? (
        <>
          <Text className="mt-3 text-center text-gray-500">
            Your membership is active
            {subscription?.current_period_end
              ? ` until ${new Date(subscription.current_period_end).toLocaleDateString()}`
              : ''}
            . You can browse, connect, and message other members.
          </Text>
        </>
      ) : (
        <>
          <Text className="mt-3 text-center text-gray-500">
            Creating and editing your profile is always free. A ₹999/month membership unlocks browsing other profiles,
            being shown to other members, and sending interests.
          </Text>
          {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
          <Pressable
            onPress={startCheckout}
            disabled={starting}
            className="mt-6 items-center rounded-lg bg-rose-600 px-8 py-3 disabled:opacity-50">
            <Text className="font-semibold text-white">{starting ? 'Starting…' : 'Subscribe — ₹999/month'}</Text>
          </Pressable>
          <Text className="mt-6 text-center text-xs text-gray-400">
            You'll be taken to Razorpay to complete payment, then can come back and refresh below.
          </Text>
          <Pressable onPress={() => refetch()} className="mt-3 rounded-lg px-6 py-2">
            <Text className="text-gray-500">I've paid — refresh status</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
