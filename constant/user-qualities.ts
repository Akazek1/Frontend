import {
  ShieldCheck,
  Sparkles,
  Clock,
  Award,
  Shield,
  Languages,
  Leaf,
  PawPrint,
  type LucideIcon,
} from "lucide-react";

export const QUALITY_KEYS = [
  "RELIABLE",
  "ATTENTION_TO_DETAIL",
  "ON_TIME",
  "EXPERIENCED",
  "INSURED",
  "MULTILINGUAL",
  "ECO_FRIENDLY",
  "PET_FRIENDLY",
] as const;

export type QualityKey = (typeof QUALITY_KEYS)[number];

export const QUALITY_ICONS: Record<QualityKey, LucideIcon> = {
  RELIABLE: ShieldCheck,
  ATTENTION_TO_DETAIL: Sparkles,
  ON_TIME: Clock,
  EXPERIENCED: Award,
  INSURED: Shield,
  MULTILINGUAL: Languages,
  ECO_FRIENDLY: Leaf,
  PET_FRIENDLY: PawPrint,
};

const QUALITY_I18N: Record<QualityKey, { titleKey: string; descKey: string }> = {
  RELIABLE: { titleKey: "qualityReliableTitle", descKey: "qualityReliableDesc" },
  ATTENTION_TO_DETAIL: { titleKey: "qualityDetailTitle", descKey: "qualityDetailDesc" },
  ON_TIME: { titleKey: "qualityOnTimeTitle", descKey: "qualityOnTimeDesc" },
  EXPERIENCED: { titleKey: "qualityExperiencedTitle", descKey: "qualityExperiencedDesc" },
  INSURED: { titleKey: "qualityInsuredTitle", descKey: "qualityInsuredDesc" },
  MULTILINGUAL: { titleKey: "qualityMultilingualTitle", descKey: "qualityMultilingualDesc" },
  ECO_FRIENDLY: { titleKey: "qualityEcoTitle", descKey: "qualityEcoDesc" },
  PET_FRIENDLY: { titleKey: "qualityPetTitle", descKey: "qualityPetDesc" },
};

/**
 * Localised quality definitions. `t` must be bound to the "profileOptions"
 * namespace. Icons live in QUALITY_ICONS.
 */
export function qualityDefs(
  t: (key: string) => string,
): Record<QualityKey, { icon: LucideIcon; title: string; description: string }> {
  return QUALITY_KEYS.reduce((acc, key) => {
    acc[key] = {
      icon: QUALITY_ICONS[key],
      title: t(QUALITY_I18N[key].titleKey),
      description: t(QUALITY_I18N[key].descKey),
    };
    return acc;
  }, {} as Record<QualityKey, { icon: LucideIcon; title: string; description: string }>);
}
