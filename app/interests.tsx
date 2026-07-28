import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useAuth } from '../lib/AuthProvider';
import type { InterestStatus } from '../lib/interests';
import { supabase } from '../lib/supabase';

type Row = {
  id: string;
  status: InterestStatus;
  direction: 'sent' | 'received';
  otherProfile: { id: string; full_name: string; city: string | null; state: string | null } | null;
};

export default function Interests() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId) return;
    setLoading(true);

    const { data: interests } = await supabase
      .from('interests')
      .select('id, sender_id, receiver_id, status')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });

    const otherIds = (interests ?? []).map((i) => (i.sender_id === myId ? i.receiver_id : i.sender_id));
    let profilesById: Record<string, { id: string; full_name: string; city: string | null; state: string | null }> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, city, state').in('id', otherIds);
      profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    }

    setRows(
      (interests ?? []).map((i) => ({
        id: i.id,
        status: i.status,
        direction: i.sender_id === myId ? 'sent' : 'received',
        otherProfile: profilesById[i.sender_id === myId ? i.receiver_id : i.sender_id] ?? null,
      }))
    );
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(interestId: string, status: 'accepted' | 'declined') {
    await supabase.from('interests').update({ status }).eq('id', interestId);
    load();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="mb-4 text-2xl font-bold text-rose-600">Interests</Text>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        ListEmptyComponent={<Text className="text-gray-400">No interests yet — browse profiles to send one.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.otherProfile && router.push(`/profile/${item.otherProfile.id}`)}
            className="flex-row items-center justify-between py-4">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">{item.otherProfile?.full_name ?? 'Unknown'}</Text>
              <Text className="text-gray-500">
                {[item.otherProfile?.city, item.otherProfile?.state].filter(Boolean).join(', ')} ·{' '}
                {item.direction === 'sent' ? 'You sent' : 'Sent to you'}
              </Text>
            </View>

            {item.direction === 'received' && item.status === 'pending' ? (
              <View className="flex-row gap-2">
                <Pressable onPress={() => respond(item.id, 'accepted')} className="rounded-full bg-rose-600 px-4 py-2">
                  <Text className="font-medium text-white">Accept</Text>
                </Pressable>
                <Pressable onPress={() => respond(item.id, 'declined')} className="rounded-full border border-gray-300 px-4 py-2">
                  <Text className="font-medium text-gray-600">Decline</Text>
                </Pressable>
              </View>
            ) : (
              <Text
                className={`font-medium ${
                  item.status === 'accepted' ? 'text-green-700' : item.status === 'declined' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {item.status}
              </Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
