import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepBasic } from '../components/onboarding/StepBasic';
import { StepCareerFamily } from '../components/onboarding/StepCareerFamily';
import { StepHoroscope } from '../components/onboarding/StepHoroscope';
import { StepPhotos } from '../components/onboarding/StepPhotos';
import { StepReligion } from '../components/onboarding/StepReligion';
import { StepVerification } from '../components/onboarding/StepVerification';
import { EMPTY_ONBOARDING_FORM, type OnboardingForm } from '../components/onboarding/types';
import { useAuth } from '../lib/AuthProvider';
import type { Profile } from '../lib/profile';
import { supabase } from '../lib/supabase';
import { useProfile } from '../lib/useProfile';

const STEP_LABELS = ['Basic', 'Verify ID', 'Religion', 'Career & family', 'Horoscope', 'About & photos'];
const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function profileToForm(profile: Profile | null): OnboardingForm {
  if (!profile) return EMPTY_ONBOARDING_FORM;
  const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  return {
    full_name: toStr(profile.full_name),
    gender: (profile.gender ?? '') as OnboardingForm['gender'],
    dob: toStr(profile.dob),
    height_cm: toStr(profile.height_cm ?? ''),
    marital_status: (profile.marital_status ?? '') as OnboardingForm['marital_status'],
    diet: (profile.diet ?? '') as OnboardingForm['diet'],
    city: toStr(profile.city),
    state: toStr(profile.state),
    country: profile.country ? toStr(profile.country) : 'India',
    id_document_type: (profile.id_document_type ?? '') as OnboardingForm['id_document_type'],
    id_document_path: toStr(profile.id_document_path),
    religion: toStr(profile.religion),
    caste: toStr(profile.caste),
    sub_caste: toStr(profile.sub_caste),
    gothra: toStr(profile.gothra),
    mother_tongue: toStr(profile.mother_tongue),
    languages_known: toStr(profile.languages_known),
    education: toStr(profile.education),
    occupation: toStr(profile.occupation),
    annual_income_inr: toStr(profile.annual_income_inr ?? ''),
    father_occupation: toStr(profile.father_occupation),
    mother_occupation: toStr(profile.mother_occupation),
    siblings: toStr(profile.siblings),
    profile_created_by: (profile.profile_created_by ?? '') as OnboardingForm['profile_created_by'],
    manglik_status: (profile.manglik_status ?? '') as OnboardingForm['manglik_status'],
    birth_time: toStr(profile.birth_time),
    birth_place: toStr(profile.birth_place),
    nakshatra: toStr(profile.nakshatra),
    rashi: toStr(profile.rashi),
    horoscope_chart_path: toStr(profile.horoscope_chart_path),
    about_me: toStr(profile.about_me),
  };
}

export default function Onboarding() {
  const { session } = useAuth();
  const { profile, loading, refetch } = useProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(EMPTY_ONBOARDING_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!loading && !initialized.current) {
      initialized.current = true;
      setForm(profileToForm(profile));
    }
  }, [loading, profile]);

  function update(patch: Partial<OnboardingForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function buildPayload() {
    const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
    const strOrNull = (v: string) => (v.trim() === '' ? null : v.trim());
    return {
      id: session!.user.id,
      full_name: form.full_name.trim(),
      gender: form.gender || null,
      dob: form.dob,
      height_cm: numOrNull(form.height_cm),
      marital_status: form.marital_status || null,
      diet: form.diet || null,
      city: strOrNull(form.city),
      state: strOrNull(form.state),
      country: strOrNull(form.country),
      id_document_type: form.id_document_type || null,
      id_document_path: strOrNull(form.id_document_path),
      religion: strOrNull(form.religion),
      caste: strOrNull(form.caste),
      sub_caste: strOrNull(form.sub_caste),
      gothra: strOrNull(form.gothra),
      mother_tongue: strOrNull(form.mother_tongue),
      languages_known: strOrNull(form.languages_known),
      education: strOrNull(form.education),
      occupation: strOrNull(form.occupation),
      annual_income_inr: numOrNull(form.annual_income_inr),
      father_occupation: strOrNull(form.father_occupation),
      mother_occupation: strOrNull(form.mother_occupation),
      siblings: strOrNull(form.siblings),
      profile_created_by: form.profile_created_by || null,
      manglik_status: form.manglik_status || null,
      birth_time: strOrNull(form.birth_time),
      birth_place: strOrNull(form.birth_place),
      nakshatra: strOrNull(form.nakshatra),
      rashi: strOrNull(form.rashi),
      horoscope_chart_path: strOrNull(form.horoscope_chart_path),
      about_me: strOrNull(form.about_me),
    };
  }

  async function validateStep(): Promise<string | null> {
    if (step === 0) {
      if (!form.full_name.trim()) return 'Enter your full name.';
      if (!form.gender) return 'Select a gender.';
      if (!DOB_PATTERN.test(form.dob)) return 'Enter date of birth as YYYY-MM-DD.';
      if (!form.city.trim() || !form.state.trim() || !form.country.trim()) return 'Enter your country, state, and city.';
      if (!form.marital_status) return 'Select a marital status.';
    }
    if (step === 1) {
      if (!form.id_document_type) return 'Choose a document type.';
      if (!form.id_document_path) return 'Upload your ID document.';
    }
    if (step === 2) {
      if (!form.religion.trim()) return 'Enter your religion.';
      if (!form.caste.trim()) return 'Enter your caste.';
    }
    if (step === 3) {
      if (!form.education.trim()) return 'Enter your education.';
      if (!form.occupation.trim()) return 'Enter your occupation.';
    }
    if (step === 5) {
      if (!form.about_me.trim()) return 'Write a few lines about yourself.';
      if (!session?.user) return 'Not signed in.';
      const { count } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', session.user.id);
      if (!count) return 'Add at least one photo.';
    }
    return null;
  }

  async function saveAndAdvance(isFinalStep: boolean) {
    setError('');

    const validationError = await validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const { error: upsertError } = await supabase.from('profiles').upsert(buildPayload());
    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    await refetch();

    if (isFinalStep) {
      router.replace('/home');
    } else {
      setStep((s) => s + 1);
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row justify-center gap-2 px-6 pt-4">
        {STEP_LABELS.map((label, i) => (
          <View key={label} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-rose-600' : 'bg-gray-200'}`} />
        ))}
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
        {step === 0 && <StepBasic form={form} update={update} />}
        {step === 1 && <StepVerification form={form} update={update} />}
        {step === 2 && <StepReligion form={form} update={update} />}
        {step === 3 && <StepCareerFamily form={form} update={update} />}
        {step === 4 && <StepHoroscope form={form} update={update} />}
        {step === 5 && <StepPhotos form={form} update={update} />}

        {error ? <Text className="mt-2 text-sm text-red-600">{error}</Text> : null}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-gray-100 px-6 py-4">
        {step > 0 && (
          <Pressable onPress={() => setStep((s) => s - 1)} className="items-center rounded-lg border border-gray-300 px-6 py-3">
            <Text className="font-semibold text-gray-700">Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => saveAndAdvance(step === STEP_LABELS.length - 1)}
          disabled={saving}
          className="flex-1 items-center rounded-lg bg-rose-600 px-6 py-3 disabled:opacity-50">
          <Text className="font-semibold text-white">
            {saving ? 'Saving…' : step === STEP_LABELS.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
