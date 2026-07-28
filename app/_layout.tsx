import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import '../global.css';
import { AuthProvider } from '../lib/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
