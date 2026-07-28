import { Text, View } from 'react-native';

import { FormField } from '../FormField';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

export function StepReligion({ form, update }: Props) {
  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-gray-900">Religion & community</Text>
      <Text className="mb-6 text-gray-500">Used for search and compatibility filters.</Text>

      <FormField label="Religion" value={form.religion} onChangeText={(v) => update({ religion: v })} placeholder="e.g. Hindu" />
      <FormField label="Caste" value={form.caste} onChangeText={(v) => update({ caste: v })} placeholder="Caste" />
      <FormField
        label="Sub-caste"
        optional
        value={form.sub_caste}
        onChangeText={(v) => update({ sub_caste: v })}
        placeholder="Sub-caste"
      />
      <FormField label="Gothra" optional value={form.gothra} onChangeText={(v) => update({ gothra: v })} placeholder="Gothra" />
      <FormField
        label="Mother tongue"
        optional
        value={form.mother_tongue}
        onChangeText={(v) => update({ mother_tongue: v })}
        placeholder="e.g. Marathi"
      />
      <FormField
        label="Other languages known"
        optional
        value={form.languages_known}
        onChangeText={(v) => update({ languages_known: v })}
        placeholder="e.g. English (fluent), Hindi (conversational)"
      />
    </View>
  );
}
