import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAuth } from '../../lib/AuthProvider';
import { getPhotoUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { FormField } from '../FormField';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

type UploadedPhoto = { id: string; url: string };

export function StepPhotos({ form, update }: Props) {
  const { session } = useAuth();
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('photos')
      .select('id, storage_path')
      .eq('profile_id', session.user.id)
      .then(({ data }) => {
        setPhotos((data ?? []).map((p) => ({ id: p.id, url: getPhotoUrl(p.storage_path) })));
      });
  }, [session?.user]);

  async function pickAndUpload() {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0] || !session?.user) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, arrayBuffer, { contentType: asset.mimeType ?? 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: photoRow, error: insertError } = await supabase
        .from('photos')
        .insert({
          profile_id: session.user.id,
          storage_path: path,
          is_primary: photos.length === 0,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      setPhotos((prev) => [...prev, { id: photoRow.id, url: getPhotoUrl(path) }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-gray-900">About & photos</Text>
      <Text className="mb-6 text-gray-500">
        At least one photo and a short bio are required before your profile can be reviewed.
      </Text>

      <FormField
        label="About me"
        value={form.about_me}
        onChangeText={(v) => update({ about_me: v })}
        placeholder="A few lines about yourself"
        multiline
        numberOfLines={4}
        style={{ minHeight: 96, textAlignVertical: 'top' }}
      />

      <View className="mb-4 flex-row flex-wrap gap-3">
        {photos.map((p) => (
          <Image key={p.id} source={{ uri: p.url }} className="h-24 w-24 rounded-lg" />
        ))}
      </View>

      {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}

      <Pressable
        onPress={pickAndUpload}
        disabled={uploading}
        className="items-center rounded-lg border border-rose-600 px-6 py-3 disabled:opacity-50">
        <Text className="font-semibold text-rose-600">{uploading ? 'Uploading…' : 'Add a photo'}</Text>
      </Pressable>
    </View>
  );
}
