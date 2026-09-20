/** Age is always derived from date of birth — never from user-entered age. */
export function ageFromDob(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

export const MIN_SIGNUP_AGE = 13;

export function meetsMinimumAge(dob: string): boolean {
  const age = ageFromDob(dob);
  return age !== null && age >= MIN_SIGNUP_AGE;
}
