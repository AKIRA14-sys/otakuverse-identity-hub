import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/** Normalize a national phone number to E.164 using the selected country. */
export function toE164(raw: string, countryCode: string): string | null {
  if (!raw.trim()) return null;
  const parsed = parsePhoneNumberFromString(raw, countryCode as CountryCode);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export function isValidPhone(raw: string, countryCode: string): boolean {
  return toE164(raw, countryCode) !== null;
}

export function formatNational(raw: string, countryCode: string): string {
  const parsed = parsePhoneNumberFromString(raw, countryCode as CountryCode);
  return parsed ? parsed.formatNational() : raw;
}
