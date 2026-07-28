import type { Diet, MaritalStatus } from './profile';

export type BrowseFilters = {
  minAge: string;
  maxAge: string;
  religion: string;
  caste: string;
  city: string;
  state: string;
  maritalStatus: MaritalStatus | '';
  diet: Diet | '';
};

export const EMPTY_BROWSE_FILTERS: BrowseFilters = {
  minAge: '',
  maxAge: '',
  religion: '',
  caste: '',
  city: '',
  state: '',
  maritalStatus: '',
  diet: '',
};

function yearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

// A person who is at least `minAge` has a dob on or before (today - minAge years);
// a person who is at most `maxAge` has a dob on or after (today - maxAge years).
export function ageFiltersToDobBounds(minAge: string, maxAge: string): { minDob?: string; maxDob?: string } {
  const bounds: { minDob?: string; maxDob?: string } = {};
  const min = Number(minAge);
  const max = Number(maxAge);
  if (minAge && Number.isFinite(min) && min > 0) bounds.maxDob = yearsAgo(min);
  if (maxAge && Number.isFinite(max) && max > 0) bounds.minDob = yearsAgo(max + 1);
  return bounds;
}

export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}
