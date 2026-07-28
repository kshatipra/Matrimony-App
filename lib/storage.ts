import { supabase } from './supabase';

export function getPhotoUrl(storagePath: string): string {
  return supabase.storage.from('profile-photos').getPublicUrl(storagePath).data.publicUrl;
}
