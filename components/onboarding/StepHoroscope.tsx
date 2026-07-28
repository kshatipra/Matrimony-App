import { Text, View } from 'react-native';

import { ChoiceGroup } from '../ChoiceGroup';
import { FormField } from '../FormField';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

export function StepHoroscope({ form, update }: Props) {
  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-gray-900">Horoscope</Text>
      <Text className="mb-6 text-gray-500">All optional — skip if you don't match profiles by horoscope.</Text>

      <ChoiceGroup
        label="Manglik status"
        optional
        value={form.manglik_status}
        onChange={(v) => update({ manglik_status: v as OnboardingForm['manglik_status'] })}
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Anshik', value: 'anshik' },
          { label: 'Not sure', value: 'unknown' },
        ]}
      />

      <FormField
        label="Birth time"
        optional
        value={form.birth_time}
        onChangeText={(v) => update({ birth_time: v })}
        placeholder="HH:MM (24h)"
      />
      <FormField
        label="Birth place"
        optional
        value={form.birth_place}
        onChangeText={(v) => update({ birth_place: v })}
        placeholder="City of birth"
      />
      <FormField
        label="Nakshatra"
        optional
        value={form.nakshatra}
        onChangeText={(v) => update({ nakshatra: v })}
        placeholder="Nakshatra"
      />
      <FormField label="Rashi" optional value={form.rashi} onChangeText={(v) => update({ rashi: v })} placeholder="Rashi" />
    </View>
  );
}
