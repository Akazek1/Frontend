"use client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Scroller from "../scroller";
import { Loader2 } from "lucide-react";
import { getCategoryIcon } from "@/constant/category-icons";
import { localizedName } from "@/lib/localized-name";
import { useTaxonomyTree } from "@/hooks/useTaxonomyTree";

interface Category {
  name: string;
  nameKn?: string | null;
  nameFr?: string | null;
  icon?: string | null;
}

const isUrl = (v?: string | null) => !!v && /^https?:\/\//i.test(v);

// Shown while the groupings load or if the request fails.
const FALLBACK_CATEGORIES: Category[] = [
  { name: "Home & Household Care" },
  { name: "Childcare & Elderly Care" },
  { name: "Repairs & Technical" },
  { name: "Outdoor & Security" },
  { name: "Transport" },
  { name: "Other Services" },
];

export default function Categories() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("home");

  // Cached + persisted: navigating back to home never refetches or spins (see
  // hooks/useTaxonomyTree). Only the very first ever load shows the spinner.
  const { data, isLoading } = useTaxonomyTree();
  const categories: Category[] =
    data && data.length > 0
      ? data.map((g) => ({ name: g.name, nameKn: g.nameKn, nameFr: g.nameFr, icon: g.icon }))
      : FALLBACK_CATEGORIES;

  const handleCategoryClick = (grouping: string) => {
    router.push(`/service?grouping=${encodeURIComponent(grouping)}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-ink font-semibold text-[16px]">{t("serviceCategories")}</h2>
        <button
          onClick={() => router.push("/service?category=all")}
          className="text-[12px] text-brand font-semibold"
        >
          {t("seeAll")}
        </button>
      </div>

      {isLoading ? (
        <div className="w-full flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : (
        <Scroller
          items={categories}
          visibleItems={4.5}
          gap={12}
          renderItem={(item: Category) => {
            const label = localizedName(item, locale);
            return (
            <button
              onClick={() => handleCategoryClick(item.name)}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-[#E8F5E9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isUrl(item.icon) ? item.icon! : getCategoryIcon(item.name)}
                  alt={label}
                  width={28}
                  height={28}
                />
              </div>
              <span className="text-[11px] font-medium text-gray-800 text-center leading-tight max-w-[56px] line-clamp-2">
                {label}
              </span>
            </button>
            );
          }}
        />
      )}
    </div>
  );
}
