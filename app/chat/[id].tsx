import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../lib/AuthProvider';
import type { Message } from '../../lib/interests';
import { supabase } from '../../lib/supabase';

export default function Chat() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user.id;

  const [otherName, setOtherName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (!conversationId || !myId) return;

    (async () => {
      setLoading(true);

      const { data: conversation } = await supabase
        .from('conversations')
        .select('id, interest_id, interests(sender_id, receiver_id)')
        .eq('id', conversationId)
        .maybeSingle();

      const interest = conversation?.interests as unknown as { sender_id: string; receiver_id: string } | null;
      if (interest) {
        const otherId = interest.sender_id === myId ? interest.receiver_id : interest.sender_id;
        const { data: other } = await supabase.from('profiles').select('full_name').eq('id', otherId).maybeSingle();
        setOtherName(other?.full_name ?? '');
      }

      const { data: existingMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      setMessages((existingMessages as Message[]) ?? []);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, myId]);

  async function send() {
    if (!draft.trim() || !myId || !conversationId) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: myId, body });
    setSending(false);
    if (error) setDraft(body);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="border-b border-gray-100 px-6 py-4">
        <Text className="text-lg font-bold text-gray-900">{otherName || 'Chat'}</Text>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400">Loading…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={<Text className="text-center text-gray-400">Say hello 👋</Text>}
            renderItem={({ item }) => {
              const mine = item.sender_id === myId;
              return (
                <View className={`mb-2 max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'self-end bg-rose-600' : 'self-start bg-gray-100'}`}>
                  <Text className={mine ? 'text-white' : 'text-gray-900'}>{item.body}</Text>
                </View>
              );
            }}
          />
        )}

        <View className="flex-row items-center gap-2 border-t border-gray-100 px-4 py-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2"
            onSubmitEditing={send}
          />
          <Pressable onPress={send} disabled={sending || !draft.trim()} className="rounded-full bg-rose-600 px-5 py-2 disabled:opacity-50">
            <Text className="font-semibold text-white">Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
