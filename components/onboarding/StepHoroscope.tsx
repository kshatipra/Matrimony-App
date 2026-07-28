import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAuth } from '../../lib/AuthProvider';
import { getPhotoUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { ChoiceGroup } from '../ChoiceGroup';
import { FormField } from '../FormField';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

export function StepHoroscope({ form, update }: Props) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function pickAndUploadChart() {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0] || !session?.user) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${session.user.id}/horoscope-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, arrayBuffer, { contentType: asset.mimeType ?? 'image/jpeg' });
      if (uploadError) throw uploadError;

      update({ horoscope_chart_path: path });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-gray-900">Horoscope</Text>
      <Text className="mb-6 text-gray-500">All optional — skip if you don't match profiles by horoscope.</Text>

      <ChoiceGroup
        label="Manglik status"
        optional
        value={form.manglik_status}
        onChange={(v) => update({ manglik_status: v as OnboardingForm['manglik_status'] })}
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Anshik', value: 'anshik' },
          { label: 'Not sure', value: 'unknown' },
        ]}
      />

      <FormField
        label="Birth time"
        optional
        value={form.birth_time}
        onChangeText={(v) => update({ birth_time: v })}
        placeholder="HH:MM (24h)"
      />
      <FormField
        label="Birth place"
        optional
        value={form.birth_place}
        onChangeText={(v) => update({ birth_place: v })}
        placeholder="City of birth"
      />
      <FormField
        label="Nakshatra"
        optional
        value={form.nakshatra}
        onChangeText={(v) => update({ nakshatra: v })}
        placeholder="Nakshatra"
      />
      <FormField label="Rashi" optional value={form.rashi} onChangeText={(v) => update({ rashi: v })} placeholder="Rashi" />

      <Text className="mb-2 text-sm font-medium text-gray-700">
        Birth chart <Text className="text-gray-400">(optional)</Text>
      </Text>
      {form.horoscope_chart_path ? (
        <Image source={{ uri: getPhotoUrl(form.horoscope_chart_path) }} className="mb-3 h-40 w-full rounded-lg" resizeMode="cover" />
      ) : null}
      {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
      <Pressable
        onPress={pickAndUploadChart}
        disabled={uploading}
        className="items-center rounded-lg border border-rose-600 px-6 py-3 disabled:opacity-50">
        <Text className="font-semibold text-rose-600">
          {uploading ? 'Uploading…' : form.horoscope_chart_path ? 'Replace chart' : 'Upload birth chart'}
        </Text>
      </Pressable>
    </View>
  );
}
