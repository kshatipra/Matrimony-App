import type { Diet, Gender, ManglikStatus, MaritalStatus, ProfileCreatedBy } from '../../lib/profile';

// All fields as strings for controlled TextInputs; numeric/enum fields are parsed on submit.
export type OnboardingForm = {
  full_name: string;
  gender: Gender | '';
  dob: string;
  height_cm: string;
  marital_status: MaritalStatus | '';
  diet: Diet | '';
  city: string;
  state: string;
  country: string;

  religion: string;
  caste: string;
  sub_caste: string;
  gothra: string;
  mother_tongue: string;

  education: string;
  occupation: string;
  annual_income_inr: string;
  father_occupation: string;
  mother_occupation: string;
  siblings: string;
  profile_created_by: ProfileCreatedBy | '';

  manglik_status: ManglikStatus | '';
  birth_time: string;
  birth_place: string;
  nakshatra: string;
  rashi: string;

  about_me: string;
};

export const EMPTY_ONBOARDING_FORM: OnboardingForm = {
  full_name: '',
  gender: '',
  dob: '',
  height_cm: '',
  marital_status: '',
  diet: '',
  city: '',
  state: '',
  country: '',
  religion: '',
  caste: '',
  sub_caste: '',
  gothra: '',
  mother_tongue: '',
  education: '',
  occupation: '',
  annual_income_inr: '',
  father_occupation: '',
  mother_occupation: '',
  siblings: '',
  profile_created_by: '',
  manglik_status: '',
  birth_time: '',
  birth_place: '',
  nakshatra: '',
  rashi: '',
  about_me: '',
};
