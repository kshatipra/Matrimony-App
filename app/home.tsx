import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useProfile } from '../lib/useProfile';
import { supabase } from '../lib/supabase';

export default function Home() {
  const { profile } = useProfile();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-rose-600">Welcome, {profile?.full_name}</Text>
      <Text className="mt-3 text-center text-gray-500">
        {profile?.verification_status === 'approved'
          ? 'Your profile is live. Browse & matching are coming in the next phase.'
          : 'Your profile is under review. We’ll notify you once it’s approved.'}
      </Text>

      <Pressable onPress={() => router.push('/onboarding')} className="mt-6 rounded-lg border border-rose-600 px-6 py-3">
        <Text className="font-semibold text-rose-600">Edit profile</Text>
      </Pressable>

      <Pressable onPress={handleSignOut} className="mt-3 rounded-lg px-6 py-3">
        <Text className="text-gray-400">Sign out</Text>
      </Pressable>
    </View>
  );
}
