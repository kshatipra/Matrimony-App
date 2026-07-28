import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { useAuth } from '../lib/AuthProvider';
import { isOnboardingComplete } from '../lib/profile';
import { useProfile } from '../lib/useProfile';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || (session && profileLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  if (!session) return <Redirect href="/sign-in" />;
  if (!isOnboardingComplete(profile)) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
