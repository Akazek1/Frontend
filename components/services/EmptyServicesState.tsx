"use client";

import { PackageOpen, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface EmptyServicesStateProps {
  onAdd: () => void;
}

export function EmptyServicesState({ onAdd }: EmptyServicesStateProps) {
  const t = useTranslations("servicesListPage");
  return (
    <section className="flex flex-col items-center rounded-2xl border border-dashed border-[#DCEEDD] bg-white px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
        <PackageOpen className="h-7 w-7 text-brand" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-[16px] font-black text-ink">
        {t("emptyTitle")}
      </h3>
      <p className="mt-1 max-w-[280px] text-[13px] text-ink-muted">
        {t("emptyDesc")}
      </p>
      <Button
        type="button"
        onClick={onAdd}
        className="mt-5 bg-brand text-white hover:bg-brand-dark"
      >
        <Plus className="h-4 w-4" />
        {t("addFirstService")}
      </Button>
    </section>
  );
}
