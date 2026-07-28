import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { supabase } from '../lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setError('');
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace('/');
  }

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-1 text-2xl font-bold text-rose-600">Welcome back</Text>
      <Text className="mb-6 text-gray-500">Sign in to continue.</Text>

      <Text className="mb-1 text-sm font-medium text-gray-700">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        className="mb-4 rounded-lg border border-gray-300 px-4 py-3"
      />

      <Text className="mb-1 text-sm font-medium text-gray-700">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Your password"
        className="mb-2 rounded-lg border border-gray-300 px-4 py-3"
      />

      {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}

      <Pressable
        onPress={handleSignIn}
        disabled={submitting}
        className="mt-4 items-center rounded-lg bg-rose-600 px-6 py-3 disabled:opacity-50">
        <Text className="font-semibold text-white">{submitting ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">New here? </Text>
        <Link href="/sign-up" className="font-semibold text-rose-600">
          Create an account
        </Link>
      </View>
    </View>
  );
}
