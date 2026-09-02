"use client";

import { useTranslations } from "next-intl";
import { qualityDefs, type QualityKey, QUALITY_KEYS } from "@/constant/user-qualities";

export function WhyClientsChooseMe({ qualities }: { qualities?: string[]; roles?: string[] }) {
  const t = useTranslations("handleProfile");
  const to = useTranslations("profileOptions");
  const valid: QualityKey[] = (qualities || []).filter((q): q is QualityKey =>
    (QUALITY_KEYS as readonly string[]).includes(q)
  );
  if (valid.length === 0) return null;
  const items = valid.slice(0, 3);
  const defs = qualityDefs(to);

  return (
    <section className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold text-ink mb-4">{t("whyClientsChooseMe")}</h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((key) => {
          const def = defs[key];
          const Icon = def.icon;
          return (
            <div key={key} className="bg-[#F4F8F2] rounded-xl p-4">
              <Icon className="w-6 h-6 text-brand mb-2" />
              <h3 className="text-sm font-bold text-ink mb-1">{def.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{def.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
