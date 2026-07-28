import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAuth } from '../../lib/AuthProvider';
import { supabase } from '../../lib/supabase';
import { ChoiceGroup } from '../ChoiceGroup';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

export function StepVerification({ form, update }: Props) {
  const { session } = useAuth();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function pickAndUpload() {
    setError('');
    if (!form.id_document_type) {
      setError('Choose a document type first.');
      return;
    }
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
      const path = `${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(path, arrayBuffer, { contentType: asset.mimeType ?? 'image/jpeg' });
      if (uploadError) throw uploadError;

      update({ id_document_path: path });
      setPreviewUri(asset.uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-gray-900">Identity verification</Text>
      <Text className="mb-6 text-gray-500">
        Upload a government ID so a moderator can confirm your name before your profile goes live. Kept private — never
        shown to other members.
      </Text>

      <ChoiceGroup
        label="Document type"
        value={form.id_document_type}
        onChange={(v) => update({ id_document_type: v as OnboardingForm['id_document_type'] })}
        options={[
          { label: 'Aadhaar', value: 'aadhaar' },
          { label: 'PAN', value: 'pan' },
          { label: 'Passport', value: 'passport' },
          { label: 'Driving licence', value: 'driving_license' },
        ]}
      />

      {previewUri ? (
        <Image source={{ uri: previewUri }} className="mb-4 h-40 w-full rounded-lg" resizeMode="cover" />
      ) : form.id_document_path ? (
        <Text className="mb-4 text-green-700">Document uploaded ✓</Text>
      ) : null}

      {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}

      <Pressable
        onPress={pickAndUpload}
        disabled={uploading}
        className="items-center rounded-lg border border-rose-600 px-6 py-3 disabled:opacity-50">
        <Text className="font-semibold text-rose-600">
          {uploading ? 'Uploading…' : form.id_document_path ? 'Replace document' : 'Upload document'}
        </Text>
      </Pressable>
    </View>
  );
}
