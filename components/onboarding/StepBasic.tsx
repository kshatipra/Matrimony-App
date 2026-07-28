import { Text, View } from 'react-native';

import { ChoiceGroup } from '../ChoiceGroup';
import { FormField } from '../FormField';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

export function StepBasic({ form, update }: Props) {
  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-gray-900">Basic details</Text>
      <Text className="mb-6 text-gray-500">This is what other members see first.</Text>

      <FormField label="Full name" value={form.full_name} onChangeText={(v) => update({ full_name: v })} placeholder="Full name" />

      <ChoiceGroup
        label="Gender"
        value={form.gender}
        onChange={(v) => update({ gender: v as OnboardingForm['gender'] })}
        options={[
          { label: 'Female', value: 'female' },
          { label: 'Male', value: 'male' },
        ]}
      />

      <FormField
        label="Date of birth"
        value={form.dob}
        onChangeText={(v) => update({ dob: v })}
        placeholder="YYYY-MM-DD"
      />

      <FormField
        label="Height (cm)"
        optional
        value={form.height_cm}
        onChangeText={(v) => update({ height_cm: v.replace(/[^0-9]/g, '') })}
        keyboardType="number-pad"
        placeholder="e.g. 165"
      />

      <ChoiceGroup
        label="Marital status"
        value={form.marital_status}
        onChange={(v) => update({ marital_status: v as OnboardingForm['marital_status'] })}
        options={[
          { label: 'Never married', value: 'never_married' },
          { label: 'Divorced', value: 'divorced' },
          { label: 'Widowed', value: 'widowed' },
          { label: 'Awaiting divorce', value: 'awaiting_divorce' },
        ]}
      />

      <ChoiceGroup
        label="Diet"
        optional
        value={form.diet}
        onChange={(v) => update({ diet: v as OnboardingForm['diet'] })}
        options={[
          { label: 'Vegetarian', value: 'vegetarian' },
          { label: 'Non-vegetarian', value: 'non_vegetarian' },
          { label: 'Eggetarian', value: 'eggetarian' },
          { label: 'Vegan', value: 'vegan' },
        ]}
      />

      <FormField label="City" value={form.city} onChangeText={(v) => update({ city: v })} placeholder="City" />
      <FormField label="State" value={form.state} onChangeText={(v) => update({ state: v })} placeholder="State" />
      <FormField
        label="Country"
        optional
        value={form.country}
        onChangeText={(v) => update({ country: v })}
        placeholder="Country"
      />
    </View>
  );
}
