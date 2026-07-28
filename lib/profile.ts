export type Gender = 'male' | 'female';
export type MaritalStatus = 'never_married' | 'divorced' | 'widowed' | 'awaiting_divorce';
export type Diet = 'vegetarian' | 'non_vegetarian' | 'eggetarian' | 'vegan';
export type ManglikStatus = 'yes' | 'no' | 'anshik' | 'unknown';
export type ProfileCreatedBy = 'self' | 'parent' | 'sibling' | 'relative';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type Role = 'user' | 'moderator' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  gender: Gender;
  dob: string;
  height_cm: number | null;
  religion: string | null;
  caste: string | null;
  sub_caste: string | null;
  gothra: string | null;
  mother_tongue: string | null;
  marital_status: MaritalStatus | null;
  diet: Diet | null;
  education: string | null;
  occupation: string | null;
  annual_income_inr: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  about_me: string | null;
  manglik_status: ManglikStatus | null;
  birth_time: string | null;
  birth_place: string | null;
  nakshatra: string | null;
  rashi: string | null;
  father_occupation: string | null;
  mother_occupation: string | null;
  siblings: string | null;
  profile_created_by: ProfileCreatedBy | null;
  verification_status: VerificationStatus;
  role: Role;
  created_at: string;
  updated_at: string;
};

// Fields that make a profile substantial enough to submit for moderation review.
export const ONBOARDING_REQUIRED_FIELDS: (keyof Profile)[] = [
  'full_name',
  'gender',
  'dob',
  'religion',
  'marital_status',
  'city',
  'state',
];

export function isOnboardingComplete(profile: Pick<Profile, (typeof ONBOARDING_REQUIRED_FIELDS)[number]> | null): boolean {
  if (!profile) return false;
  return ONBOARDING_REQUIRED_FIELDS.every((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });
}
