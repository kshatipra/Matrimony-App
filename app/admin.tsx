import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';

import type { Profile } from '../lib/profile';
import { getPhotoUrl } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { useProfile } from '../lib/useProfile';

type PendingProfile = Pick<
  Profile,
  'id' | 'full_name' | 'gender' | 'dob' | 'city' | 'state' | 'religion' | 'verification_status' | 'id_document_type' | 'id_document_path'
>;

type Photo = { id: string; storage_path: string; is_approved: boolean };

export default function Admin() {
  const { profile, loading: profileLoading } = useProfile();
  const [pending, setPending] = useState<PendingProfile[]>([]);
  const [photosByProfile, setPhotosByProfile] = useState<Record<string, Photo[]>>({});
  const [idDocUrls, setIdDocUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator';

  const load = useCallback(async () => {
    if (!isStaff) return;
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, gender, dob, city, state, religion, verification_status, id_document_type, id_document_path')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });
    setPending((profiles as PendingProfile[]) ?? []);

    const ids = (profiles ?? []).map((p) => p.id);
    if (ids.length > 0) {
      const { data: photos } = await supabase
        .from('photos')
        .select('id, profile_id, storage_path, is_approved')
        .in('profile_id', ids);
      const grouped: Record<string, Photo[]> = {};
      for (const photo of photos ?? []) {
        grouped[photo.profile_id] = grouped[photo.profile_id] ?? [];
        grouped[photo.profile_id].push(photo);
      }
      setPhotosByProfile(grouped);

      const signedEntries = await Promise.all(
        (profiles ?? [])
          .filter((p) => p.id_document_path)
          .map(async (p) => {
            const { data } = await supabase.storage
              .from('identity-documents')
              .createSignedUrl(p.id_document_path as string, 60 * 5);
            return [p.id, data?.signedUrl ?? null] as const;
          })
      );
      setIdDocUrls(Object.fromEntries(signedEntries.filter(([, url]) => url)) as Record<string, string>);
    } else {
      setPhotosByProfile({});
      setIdDocUrls({});
    }
    setLoading(false);
  }, [isStaff]);

  useEffect(() => {
    load();
  }, [load]);

  async function setVerification(id: string, status: 'approved' | 'rejected') {
    await supabase.from('profiles').update({ verification_status: status }).eq('id', id);
    load();
  }

  async function setPhotoApproval(photoId: string, isApproved: boolean) {
    await supabase.from('photos').update({ is_approved: isApproved }).eq('id', photoId);
    load();
  }

  if (profileLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  if (!isStaff) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-gray-900">Not authorized</Text>
        <Text className="mt-2 text-center text-gray-500">This page is for moderators and admins only.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="mb-1 text-2xl font-bold text-rose-600">Pending profiles</Text>
      <Text className="mb-4 text-gray-500">{pending.length} awaiting review</Text>

      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        renderItem={({ item }) => (
          <View className="py-4">
            <Text className="text-lg font-semibold text-gray-900">{item.full_name}</Text>
            <Text className="text-gray-500">
              {item.gender} · {item.dob} · {item.city}, {item.state} · {item.religion}
            </Text>

            <View className="mt-2">
              <Text className="text-sm font-medium text-gray-700">
                ID document: {item.id_document_type ?? 'none'}
              </Text>
              {idDocUrls[item.id] ? (
                <Image source={{ uri: idDocUrls[item.id] }} className="mt-1 h-40 w-full rounded-lg" resizeMode="contain" />
              ) : (
                <Text className="text-sm text-red-600">No document uploaded</Text>
              )}
            </View>

            {photosByProfile[item.id]?.length ? (
              <View className="mt-3">
                {photosByProfile[item.id].map((photo) => (
                  <View key={photo.id} className="mb-2 flex-row items-center justify-between">
                    <Image source={{ uri: getPhotoUrl(photo.storage_path) }} className="h-12 w-12 rounded-lg" />
                    <Pressable
                      onPress={() => setPhotoApproval(photo.id, !photo.is_approved)}
                      className={`ml-2 rounded-full px-3 py-1 ${photo.is_approved ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Text className={photo.is_approved ? 'text-green-700' : 'text-gray-600'}>
                        {photo.is_approved ? 'Photo approved' : 'Approve photo'}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="mt-2 text-sm text-red-600">No photos uploaded</Text>
            )}

            <View className="mt-3 flex-row gap-3">
              <Pressable
                onPress={() => setVerification(item.id, 'approved')}
                className="items-center rounded-lg bg-rose-600 px-5 py-2">
                <Text className="font-semibold text-white">Approve</Text>
              </Pressable>
              <Pressable
                onPress={() => setVerification(item.id, 'rejected')}
                className="items-center rounded-lg border border-gray-300 px-5 py-2">
                <Text className="font-semibold text-gray-700">Reject</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="text-gray-400">Nothing pending.</Text>}
      />
    </View>
  );
}
