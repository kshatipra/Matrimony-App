import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useAuth } from '../../lib/AuthProvider';
import { calculateAge } from '../../lib/browse';
import type { Interest } from '../../lib/interests';
import type { Profile } from '../../lib/profile';
import { getPhotoUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

type Row = { label: string; value: string | null | undefined };

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [interest, setInterest] = useState<Interest | null | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);

  const loadInterest = useCallback(async () => {
    if (!myId || !id) return;
    const { data } = await supabase
      .from('interests')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${myId})`)
      .maybeSingle();
    setInterest((data as Interest | null) ?? null);

    if (data?.status === 'accepted') {
      const { data: conversation } = await supabase.from('conversations').select('id').eq('interest_id', data.id).maybeSingle();
      setConversationId(conversation?.id ?? null);
    } else {
      setConversationId(null);
    }
  }, [myId, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error: profileError } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
      setProfile(data as Profile | null);

      const { data: photos } = await supabase
        .from('photos')
        .select('storage_path')
        .eq('profile_id', id)
        .eq('is_approved', true)
        .order('is_primary', { ascending: false });
      setPhotoUrls((photos ?? []).map((p) => getPhotoUrl(p.storage_path)));
      setLoading(false);
    })();
    loadInterest();
  }, [id, loadInterest]);

  async function sendInterest() {
    if (!myId || !id) return;
    setActing(true);
    setActionError('');
    const { error: insertError } = await supabase.from('interests').insert({ sender_id: myId, receiver_id: id, status: 'pending' });
    setActing(false);
    if (insertError) {
      setActionError(insertError.message);
      return;
    }
    loadInterest();
  }

  async function respondToInterest(status: 'accepted' | 'declined') {
    if (!interest) return;
    setActing(true);
    setActionError('');
    const { error: updateError } = await supabase.from('interests').update({ status }).eq('id', interest.id);
    setActing(false);
    if (updateError) {
      setActionError(updateError.message);
      return;
    }
    loadInterest();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-gray-500">{error || 'Profile not found.'}</Text>
      </View>
    );
  }

  const rows: Row[] = [
    { label: 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : null },
    { label: 'Marital status', value: profile.marital_status },
    { label: 'Diet', value: profile.diet },
    { label: 'Religion', value: profile.religion },
    { label: 'Caste', value: profile.caste },
    { label: 'Mother tongue', value: profile.mother_tongue },
    { label: 'Languages known', value: profile.languages_known },
    { label: 'Education', value: profile.education },
    { label: 'Occupation', value: profile.occupation },
    { label: 'Location', value: [profile.city, profile.state, profile.country].filter(Boolean).join(', ') },
    { label: "Father's occupation", value: profile.father_occupation },
    { label: "Mother's occupation", value: profile.mother_occupation },
    { label: 'Siblings', value: profile.siblings },
    { label: 'Manglik status', value: profile.manglik_status },
    { label: 'Nakshatra', value: profile.nakshatra },
    { label: 'Rashi', value: profile.rashi },
  ].filter((r) => r.value);

  const iAmSender = interest?.sender_id === myId;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {photoUrls.length > 0 ? (
        <Image source={{ uri: photoUrls[0] }} className="h-80 w-full" resizeMode="cover" />
      ) : (
        <View className="h-80 w-full items-center justify-center bg-gray-100">
          <Text className="text-6xl text-gray-300">{profile.full_name?.[0]}</Text>
        </View>
      )}

      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900">
          {profile.full_name}, {calculateAge(profile.dob)}
        </Text>

        {profile.about_me ? <Text className="mt-3 text-gray-600">{profile.about_me}</Text> : null}

        <View className="mt-4">
          {interest === undefined ? null : !interest ? (
            <Pressable onPress={sendInterest} disabled={acting} className="items-center rounded-lg bg-rose-600 px-6 py-3 disabled:opacity-50">
              <Text className="font-semibold text-white">{acting ? 'Sending…' : 'Send Interest'}</Text>
            </Pressable>
          ) : interest.status === 'pending' && iAmSender ? (
            <View className="items-center rounded-lg bg-gray-100 px-6 py-3">
              <Text className="font-medium text-gray-600">Interest sent — waiting for a response</Text>
            </View>
          ) : interest.status === 'pending' && !iAmSender ? (
            <View>
              <Text className="mb-2 text-center text-gray-600">This member is interested in you</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => respondToInterest('accepted')}
                  disabled={acting}
                  className="flex-1 items-center rounded-lg bg-rose-600 px-6 py-3 disabled:opacity-50">
                  <Text className="font-semibold text-white">Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => respondToInterest('declined')}
                  disabled={acting}
                  className="flex-1 items-center rounded-lg border border-gray-300 px-6 py-3 disabled:opacity-50">
                  <Text className="font-semibold text-gray-700">Decline</Text>
                </Pressable>
              </View>
            </View>
          ) : interest.status === 'accepted' ? (
            <Pressable
              onPress={() => conversationId && router.push(`/chat/${conversationId}`)}
              disabled={!conversationId}
              className="items-center rounded-lg bg-rose-600 px-6 py-3 disabled:opacity-50">
              <Text className="font-semibold text-white">Message</Text>
            </Pressable>
          ) : (
            <View className="items-center rounded-lg bg-gray-100 px-6 py-3">
              <Text className="font-medium text-gray-500">Declined</Text>
            </View>
          )}
          {actionError ? <Text className="mt-2 text-sm text-red-600">{actionError}</Text> : null}
        </View>

        <View className="mt-6">
          {rows.map((row) => (
            <View key={row.label} className="flex-row justify-between border-b border-gray-100 py-3">
              <Text className="text-gray-500">{row.label}</Text>
              <Text className="max-w-[60%] text-right font-medium text-gray-900">{row.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
