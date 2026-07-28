import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import { calculateAge } from '../../lib/browse';
import type { Profile } from '../../lib/profile';
import { getPhotoUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

type Row = { label: string; value: string | null | undefined };

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [id]);

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
