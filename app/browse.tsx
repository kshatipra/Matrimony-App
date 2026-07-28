import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ageFiltersToDobBounds, calculateAge, EMPTY_BROWSE_FILTERS, type BrowseFilters } from '../lib/browse';
import type { Profile } from '../lib/profile';
import { getPhotoUrl } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { useProfile } from '../lib/useProfile';

type Result = Pick<
  Profile,
  'id' | 'full_name' | 'dob' | 'city' | 'state' | 'religion' | 'education' | 'occupation' | 'diet' | 'marital_status'
> & { photoUrl: string | null };

export default function Browse() {
  const { profile } = useProfile();
  const [filters, setFilters] = useState<BrowseFilters>(EMPTY_BROWSE_FILTERS);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError('');

    const oppositeGender = profile.gender === 'male' ? 'female' : 'male';
    let query = supabase
      .from('profiles')
      .select('id, full_name, dob, city, state, religion, education, occupation, diet, marital_status')
      .eq('gender', oppositeGender)
      .eq('verification_status', 'approved')
      .neq('id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const { minDob, maxDob } = ageFiltersToDobBounds(filters.minAge, filters.maxAge);
    if (minDob) query = query.gte('dob', minDob);
    if (maxDob) query = query.lte('dob', maxDob);
    if (filters.religion.trim()) query = query.ilike('religion', `%${filters.religion.trim()}%`);
    if (filters.caste.trim()) query = query.ilike('caste', `%${filters.caste.trim()}%`);
    if (filters.city.trim()) query = query.ilike('city', `%${filters.city.trim()}%`);
    if (filters.state.trim()) query = query.ilike('state', `%${filters.state.trim()}%`);
    if (filters.maritalStatus) query = query.eq('marital_status', filters.maritalStatus);
    if (filters.diet) query = query.eq('diet', filters.diet);

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const ids = (data ?? []).map((p) => p.id);
    let photoMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: photos } = await supabase
        .from('photos')
        .select('profile_id, storage_path')
        .in('profile_id', ids)
        .eq('is_primary', true)
        .eq('is_approved', true);
      photoMap = Object.fromEntries((photos ?? []).map((p) => [p.profile_id, getPhotoUrl(p.storage_path)]));
    }

    setResults((data ?? []).map((p) => ({ ...p, photoUrl: photoMap[p.id] ?? null })));
    setLoading(false);
  }, [profile, filters]);

  return (
    <View className="flex-1 bg-white pt-16">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 px-4" contentContainerStyle={{ gap: 8 }}>
        <TextInput
          value={filters.religion}
          onChangeText={(v) => setFilters((f) => ({ ...f, religion: v }))}
          placeholder="Religion"
          className="w-32 rounded-full border border-gray-300 px-4 py-2"
        />
        <TextInput
          value={filters.city}
          onChangeText={(v) => setFilters((f) => ({ ...f, city: v }))}
          placeholder="City"
          className="w-32 rounded-full border border-gray-300 px-4 py-2"
        />
        <TextInput
          value={filters.minAge}
          onChangeText={(v) => setFilters((f) => ({ ...f, minAge: v.replace(/[^0-9]/g, '') }))}
          placeholder="Min age"
          keyboardType="number-pad"
          className="w-24 rounded-full border border-gray-300 px-4 py-2"
        />
        <TextInput
          value={filters.maxAge}
          onChangeText={(v) => setFilters((f) => ({ ...f, maxAge: v.replace(/[^0-9]/g, '') }))}
          placeholder="Max age"
          keyboardType="number-pad"
          className="w-24 rounded-full border border-gray-300 px-4 py-2"
        />
      </ScrollView>

      <View className="px-4">
        <Pressable onPress={runSearch} className="mb-3 items-center rounded-lg bg-rose-600 px-6 py-3">
          <Text className="font-semibold text-white">{loading ? 'Searching…' : 'Search'}</Text>
        </Pressable>
        {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        ListEmptyComponent={
          !loading ? <Text className="mt-6 text-center text-gray-400">Tap Search to find matches.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/profile/${item.id}`)} className="flex-row items-center gap-4 py-4">
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} className="h-16 w-16 rounded-full" />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-gray-400">{item.full_name?.[0] ?? '?'}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {item.full_name}, {calculateAge(item.dob)}
              </Text>
              <Text className="text-gray-500">
                {[item.city, item.state].filter(Boolean).join(', ')} {item.religion ? `· ${item.religion}` : ''}
              </Text>
              {item.occupation ? <Text className="text-gray-400">{item.occupation}</Text> : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
