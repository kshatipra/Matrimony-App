import { Text, View } from 'react-native';

import { ChoiceGroup } from '../ChoiceGroup';
import { FormField } from '../FormField';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

export function StepCareerFamily({ form, update }: Props) {
  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-gray-900">Education, career & family</Text>
      <Text className="mb-6 text-gray-500">Helps others understand your background.</Text>

      <FormField label="Education" optional value={form.education} onChangeText={(v) => update({ education: v })} placeholder="e.g. B.Tech Computer Science" />
      <FormField label="Occupation" optional value={form.occupation} onChangeText={(v) => update({ occupation: v })} placeholder="e.g. Software Engineer" />
      <FormField
        label="Annual income (INR)"
        optional
        value={form.annual_income_inr}
        onChangeText={(v) => update({ annual_income_inr: v.replace(/[^0-9]/g, '') })}
        keyboardType="number-pad"
        placeholder="e.g. 1200000"
      />
      <FormField
        label="Father's occupation"
        optional
        value={form.father_occupation}
        onChangeText={(v) => update({ father_occupation: v })}
        placeholder="Father's occupation"
      />
      <FormField
        label="Mother's occupation"
        optional
        value={form.mother_occupation}
        onChangeText={(v) => update({ mother_occupation: v })}
        placeholder="Mother's occupation"
      />
      <FormField
        label="Siblings"
        optional
        value={form.siblings}
        onChangeText={(v) => update({ siblings: v })}
        placeholder="e.g. 1 brother (married)"
      />

      <ChoiceGroup
        label="Profile created by"
        optional
        value={form.profile_created_by}
        onChange={(v) => update({ profile_created_by: v as OnboardingForm['profile_created_by'] })}
        options={[
          { label: 'Self', value: 'self' },
          { label: 'Parent', value: 'parent' },
          { label: 'Sibling', value: 'sibling' },
          { label: 'Relative', value: 'relative' },
        ]}
      />
    </View>
  );
}
