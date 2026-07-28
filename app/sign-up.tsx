import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { supabase } from '../lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSignUp() {
    setError('');
    if (!email || !password) {
      setError('Enter an email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.replace('/onboarding');
    } else {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-xl font-semibold text-gray-900">Check your email</Text>
        <Text className="mt-2 text-center text-gray-500">
          We sent a confirmation link to {email}. Confirm it, then sign in below.
        </Text>
        <Pressable onPress={() => router.replace('/sign-in')} className="mt-6 rounded-lg bg-rose-600 px-6 py-3">
          <Text className="font-semibold text-white">Go to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-1 text-2xl font-bold text-rose-600">Create your account</Text>
      <Text className="mb-6 text-gray-500">You'll build your profile in the next step.</Text>

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
        placeholder="At least 8 characters"
        className="mb-2 rounded-lg border border-gray-300 px-4 py-3"
      />

      {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}

      <Pressable
        onPress={handleSignUp}
        disabled={submitting}
        className="mt-4 items-center rounded-lg bg-rose-600 px-6 py-3 disabled:opacity-50">
        <Text className="font-semibold text-white">{submitting ? 'Creating account…' : 'Sign up'}</Text>
      </Pressable>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">Already have an account? </Text>
        <Link href="/sign-in" className="font-semibold text-rose-600">
          Sign in
        </Link>
      </View>
    </View>
  );
}
