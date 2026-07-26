import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { supabase } from '../lib/supabase';

export default function Home() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          setStatus('error');
          setDetail(error.message);
        } else {
          setStatus('connected');
        }
      });
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-semibold text-rose-600">Matrimony</Text>
      <Text className="mt-2 text-gray-500">Phase 0: foundations are up.</Text>
      <Text className="mt-6 text-sm text-gray-400">
        Supabase: {status === 'checking' ? 'checking…' : status === 'connected' ? 'connected ✓' : `error — ${detail}`}
      </Text>
    </View>
  );
}
