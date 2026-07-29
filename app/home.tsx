import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useProfile } from '../lib/useProfile';
import { useSubscription } from '../lib/useSubscription';
import { supabase } from '../lib/supabase';

export default function Home() {
  const { profile } = useProfile();
  const { isActive } = useSubscription();

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
        <>
          <Pressable
            onPress={() => router.push('/upgrade')}
            className={`mt-6 items-center rounded-lg px-6 py-3 ${isActive ? 'border border-rose-600' : 'bg-rose-600'}`}>
            <Text className={isActive ? 'font-semibold text-rose-600' : 'font-semibold text-white'}>
              {isActive ? 'Membership active' : 'Subscribe to unlock browsing'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/browse')} className="mt-3 items-center rounded-lg border border-rose-600 px-6 py-3">
            <Text className="font-semibold text-rose-600">Browse profiles</Text>
          </Pressable>
          <View className="mt-3 flex-row gap-3">
            <Pressable onPress={() => router.push('/interests')} className="items-center rounded-lg border border-rose-600 px-6 py-3">
              <Text className="font-semibold text-rose-600">Interests</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/messages')} className="items-center rounded-lg border border-rose-600 px-6 py-3">
              <Text className="font-semibold text-rose-600">Messages</Text>
            </Pressable>
          </View>
        </>
      )}

      <Pressable onPress={() => router.push('/onboarding')} className="mt-3 rounded-lg border border-rose-600 px-6 py-3">
        <Text className="font-semibold text-rose-600">Edit profile</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/biodata')} className="mt-3 rounded-lg px-6 py-3">
        <Text className="font-semibold text-gray-600">Download biodata (PDF)</Text>
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
