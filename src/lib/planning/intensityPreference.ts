export const intensityPreferenceOptions = ["light", "balanced", "intense", "recovery"] as const;

export type NormalizedIntensityPreference = (typeof intensityPreferenceOptions)[number];
export type IntensityPreferenceInput = NormalizedIntensityPreference | "high" | null | undefined | string;

export const normalizeIntensityPreference = (
  value: IntensityPreferenceInput
): NormalizedIntensityPreference => {
  if (value === "high" || value === "intense") return "intense";
  if (value === "recovery" || value === "light" || value === "balanced") return value;
  return "balanced";
};

export const getExpectedIntensityForPreference = (
  preference: IntensityPreferenceInput,
  remainingMinutes: number
) => {
  const normalized = normalizeIntensityPreference(preference);

  if (normalized === "recovery") return 1.5;
  if (normalized === "light") return 2.5;
  if (normalized === "intense") return 4.5;

  if (remainingMinutes >= 30) return 2.5;
  if (remainingMinutes <= 12) return 4;
  return 3;
};
