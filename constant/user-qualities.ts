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

export const QUALITY_DEFS: Record<QualityKey, { icon: LucideIcon; title: string; description: string }> = {
  RELIABLE: {
    icon: ShieldCheck,
    title: "Reliable & Trustworthy",
    description: "You can count on me to get the job done right.",
  },
  ATTENTION_TO_DETAIL: {
    icon: Sparkles,
    title: "Attention to Detail",
    description: "I make sure every corner is spotless.",
  },
  ON_TIME: {
    icon: Clock,
    title: "On Time",
    description: "I respect your time and always arrive on time.",
  },
  EXPERIENCED: {
    icon: Award,
    title: "Experienced",
    description: "Years of hands-on experience in my field.",
  },
  INSURED: {
    icon: Shield,
    title: "Insured",
    description: "Covered so you can hire with confidence.",
  },
  MULTILINGUAL: {
    icon: Languages,
    title: "Multilingual",
    description: "I can communicate in multiple languages.",
  },
  ECO_FRIENDLY: {
    icon: Leaf,
    title: "Eco-Friendly",
    description: "I use safe, environment-friendly products.",
  },
  PET_FRIENDLY: {
    icon: PawPrint,
    title: "Pet-Friendly",
    description: "Comfortable working in homes with pets.",
  },
};
