import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useAuth } from '../lib/AuthProvider';
import { supabase } from '../lib/supabase';

type ConversationRow = {
  id: string;
  otherProfile: { id: string; full_name: string } | null;
  lastMessage: string | null;
};

export default function Messages() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId) return;
    setLoading(true);

    const { data: interests } = await supabase
      .from('interests')
      .select('id, sender_id, receiver_id')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .eq('status', 'accepted');

    const interestIds = (interests ?? []).map((i) => i.id);
    if (interestIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: conversations } = await supabase.from('conversations').select('id, interest_id').in('interest_id', interestIds);

    const otherIdByInterest = Object.fromEntries(
      (interests ?? []).map((i) => [i.id, i.sender_id === myId ? i.receiver_id : i.sender_id])
    );
    const otherIds = Object.values(otherIdByInterest);
    const { data: profiles } = otherIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', otherIds)
      : { data: [] };
    const profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    const lastMessages = await Promise.all(
      (conversations ?? []).map((c) =>
        supabase
          .from('messages')
          .select('body')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    );

    setRows(
      (conversations ?? []).map((c, idx) => ({
        id: c.id,
        otherProfile: profilesById[otherIdByInterest[c.interest_id]] ?? null,
        lastMessage: lastMessages[idx]?.data?.body ?? null,
      }))
    );
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="mb-4 text-2xl font-bold text-rose-600">Messages</Text>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        ListEmptyComponent={<Text className="text-gray-400">No conversations yet — accept an interest to start chatting.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/chat/${item.id}`)} className="py-4">
            <Text className="text-lg font-semibold text-gray-900">{item.otherProfile?.full_name ?? 'Unknown'}</Text>
            <Text className="text-gray-500" numberOfLines={1}>
              {item.lastMessage ?? 'Say hello 👋'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
