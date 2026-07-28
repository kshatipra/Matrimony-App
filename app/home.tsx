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
          ? 'Your profile is live.'
          : 'Your profile is under review. We’ll notify you once it’s approved.'}
      </Text>

      {profile?.verification_status === 'approved' && (
        <Pressable onPress={() => router.push('/browse')} className="mt-6 items-center rounded-lg bg-rose-600 px-6 py-3">
          <Text className="font-semibold text-white">Browse profiles</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.push('/onboarding')} className="mt-3 rounded-lg border border-rose-600 px-6 py-3">
        <Text className="font-semibold text-rose-600">Edit profile</Text>
      </Pressable>

      {(profile?.role === 'admin' || profile?.role === 'moderator') && (
        <Pressable onPress={() => router.push('/admin')} className="mt-3 rounded-lg px-6 py-3">
          <Text className="font-semibold text-gray-700">Admin review queue</Text>
        </Pressable>
      )}

      <Pressable onPress={handleSignOut} className="mt-3 rounded-lg px-6 py-3">
        <Text className="text-gray-400">Sign out</Text>
      </Pressable>
    </View>
  );
}
