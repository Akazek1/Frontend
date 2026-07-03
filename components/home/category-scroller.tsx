"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Scroller from "../scroller";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { getCategoryIcon } from "@/constant/category-icons";
import { localizedName } from "@/lib/localized-name";

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
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Broad groupings (ServiceCategory) — the stable top-level browse layer.
      const response = await api.get("/taxonomy/tree");
      const groupings: Category[] = (response.data.data || response.data || []).map(
        (g: { name: string; nameKn?: string | null; nameFr?: string | null; icon?: string | null }) => ({
          name: g.name,
          nameKn: g.nameKn,
          nameFr: g.nameFr,
          icon: g.icon,
        })
      );

      if (groupings.length > 0) setCategories(groupings);
    } catch (err) {
      console.error("Failed to fetch groupings", err);
      // Keep fallback groupings on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (grouping: string) => {
    router.push(`/service?grouping=${encodeURIComponent(grouping)}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-ink font-semibold text-[16px]">Service Categories</h2>
        <button
          onClick={() => router.push("/service?category=all")}
          className="text-[12px] text-brand font-semibold"
        >
          See all
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
