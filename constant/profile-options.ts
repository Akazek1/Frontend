/**
 * Single source of truth for the profile dropdown options whose *value* is
 * persisted to the backend (English, stable) but whose *label* is localised.
 *
 * `profileOptionLabel(kind, value, t)` maps a stored value back to a localised
 * label for display (e.g. on the public profile). `t` must be bound to the
 * "profileOptions" namespace.
 */

export type ProfileOptionKind = "gender" | "education" | "health" | "workTime";

type Option = { value: string; key: string };

export const GENDER_OPTIONS: Option[] = [
  { value: "MALE", key: "genderMale" },
  { value: "FEMALE", key: "genderFemale" },
  { value: "OTHER", key: "genderOther" },
];

export const EDUCATION_OPTIONS: Option[] = [
  { value: "No formal education", key: "eduNone" },
  { value: "Primary school", key: "eduPrimary" },
  { value: "Lower secondary", key: "eduLowerSecondary" },
  { value: "Upper secondary / high school", key: "eduUpperSecondary" },
  { value: "Vocational / TVET", key: "eduVocational" },
  { value: "University", key: "eduUniversity" },
  { value: "Other", key: "eduOther" },
];

export const HEALTH_OPTIONS: Option[] = [
  { value: "Fit for work", key: "healthFit" },
  { value: "Can do light work", key: "healthLight" },
  { value: "Prefer not to say", key: "healthPrivate" },
];

export const WORK_TIME_OPTIONS: Option[] = [
  { value: "Morning", key: "workMorning" },
  { value: "Afternoon", key: "workAfternoon" },
  { value: "Evening", key: "workEvening" },
  { value: "Full day", key: "workFullDay" },
  { value: "Live-in", key: "workLiveIn" },
  { value: "Flexible", key: "workFlexible" },
];

const BY_KIND: Record<ProfileOptionKind, Option[]> = {
  gender: GENDER_OPTIONS,
  education: EDUCATION_OPTIONS,
  health: HEALTH_OPTIONS,
  workTime: WORK_TIME_OPTIONS,
};

/**
 * Older accounts (seeded/demo data, and profiles saved before the education
 * dropdown was standardised) may still carry free-text values that don't
 * match `EDUCATION_OPTIONS` exactly. Map the common ones back onto a
 * standard option so they still get a localised label instead of showing
 * raw English text.
 */
const LEGACY_EDUCATION_ALIASES: Record<string, string> = {
  "Completed primary school": "Primary school",
  "Completed lower secondary school": "Lower secondary",
  "Completed ordinary level secondary school": "Lower secondary",
  "Completed secondary school": "Upper secondary / high school",
  "Secondary school": "Upper secondary / high school",
  "Technical diploma": "Vocational / TVET",
  "University degree": "University",
};

function normalizeOptionValue(kind: ProfileOptionKind, value: string): string {
  if (kind === "education" && LEGACY_EDUCATION_ALIASES[value]) {
    return LEGACY_EDUCATION_ALIASES[value];
  }
  return value;
}

export function profileOptionLabel(
  kind: ProfileOptionKind,
  value: string | undefined | null,
  t: (key: string) => string,
): string | undefined {
  if (!value) return undefined;
  const normalized = normalizeOptionValue(kind, value);
  const match = BY_KIND[kind].find((o) => o.value === normalized);
  return match ? t(match.key) : value;
}
