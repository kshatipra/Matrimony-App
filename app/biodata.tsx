import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { buildBiodataHtml } from '../lib/biodata';
import { getPhotoUrl } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { useProfile } from '../lib/useProfile';

// On web, expo-print's printToFileAsync opens the browser's print dialog for the
// CURRENT page rather than the html string passed to it — so a custom document has to
// be printed via a hidden iframe instead, which the browser prints in isolation.
function printHtmlOnWeb(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve();
      }, 500);
    };
    iframe.srcdoc = html;
  });
}

export default function Biodata() {
  const { profile, loading } = useProfile();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!profile) return;
    setGenerating(true);
    setError('');
    try {
      const { data: primaryPhoto } = await supabase
        .from('photos')
        .select('storage_path')
        .eq('profile_id', profile.id)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();

      const html = await buildBiodataHtml(profile, primaryPhoto ? getPhotoUrl(primaryPhoto.storage_path) : null);

      if (Platform.OS === 'web') {
        await printHtmlOnWeb(html);
        return;
      }

      const result = await Print.printToFileAsync({ html });
      if (result?.uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate biodata.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-rose-600">Download Biodata</Text>
      <Text className="mt-3 text-center text-gray-500">
        Generates a traditional biodata PDF from your profile — personal details, education, family, and horoscope —
        ready to share.
      </Text>

      {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}

      <Pressable
        onPress={generate}
        disabled={generating}
        className="mt-6 items-center rounded-lg bg-rose-600 px-8 py-3 disabled:opacity-50">
        <Text className="font-semibold text-white">{generating ? 'Generating…' : 'Download PDF'}</Text>
      </Pressable>
    </View>
  );
}
