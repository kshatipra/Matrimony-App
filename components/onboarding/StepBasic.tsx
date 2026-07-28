import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChoiceGroup } from '../ChoiceGroup';
import { FormField } from '../FormField';
import { SelectField } from '../SelectField';
import { CITY_OTHER_OPTION, COUNTRIES, INDIA_CITIES_BY_STATE, INDIA_STATES } from '../../lib/indiaLocations';
import type { OnboardingForm } from './types';

type Props = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
};

export function StepBasic({ form, update }: Props) {
  const isIndia = form.country === 'India';
  const curatedCities = INDIA_CITIES_BY_STATE[form.state] ?? [];
  const hasCuratedCities = isIndia && curatedCities.length > 0;
  const [manualCity, setManualCity] = useState(hasCuratedCities && form.city !== '' && !curatedCities.includes(form.city));

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

      <SelectField
        label="Country"
        value={form.country}
        onChange={(v) => {
          setManualCity(false);
          update({ country: v, state: '', city: '' });
        }}
        options={COUNTRIES}
      />

      {isIndia ? (
        <SelectField
          label="State"
          value={form.state}
          onChange={(v) => {
            setManualCity(false);
            update({ state: v, city: '' });
          }}
          options={INDIA_STATES}
        />
      ) : (
        <FormField label="State" value={form.state} onChangeText={(v) => update({ state: v })} placeholder="State" />
      )}

      {hasCuratedCities && !manualCity ? (
        <SelectField
          label="City"
          value={form.city}
          onChange={(v) => {
            if (v === CITY_OTHER_OPTION) {
              setManualCity(true);
              update({ city: '' });
            } else {
              update({ city: v });
            }
          }}
          options={[...curatedCities, CITY_OTHER_OPTION]}
        />
      ) : (
        <FormField label="City" value={form.city} onChangeText={(v) => update({ city: v })} placeholder="City" />
      )}
    </View>
  );
}
