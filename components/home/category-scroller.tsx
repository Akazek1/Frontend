"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Scroller from "../scroller";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { getCategoryIcon } from "@/constant/category-icons";

interface Category {
  title: string;
}

// Shown when the API has fewer items — covers the full range of services
const FALLBACK_CATEGORIES: Category[] = [
  { title: "Cooking" },
  { title: "House Cleaning" },
  { title: "Nanny / Childcare" },
  { title: "Electrician" },
  { title: "Plumbing" },
  { title: "Painting" },
  { title: "Carpentry" },
  { title: "Gardening" },
  { title: "Laundry" },
  { title: "Driver" },
  { title: "Security Guard" },
  { title: "Pet Care" },
  { title: "AC Repair" },
  { title: "Tutoring" },
  { title: "Errands" },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/services/categories");
      const apiCategories: Category[] = (response.data.data || []).map(
        (cat: { name: string }) => ({ title: cat.name })
      );

      // Merge API categories first, then append fallbacks not already covered
      const merged = [...apiCategories];
      FALLBACK_CATEGORIES.forEach((fb) => {
        const alreadyIn = merged.some(
          (c) => c.title.toLowerCase() === fb.title.toLowerCase()
        );
        if (!alreadyIn) merged.push(fb);
      });

      setCategories(merged);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      // Keep fallback categories on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/service/?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-ink font-semibold text-[16px]">Popular Categories</h2>
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
          renderItem={(item: Category) => (
            <button
              onClick={() => handleCategoryClick(item.title)}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-[#E8F5E9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getCategoryIcon(item.title)}
                  alt={item.title}
                  width={28}
                  height={28}
                />
              </div>
              <span className="text-[11px] font-medium text-gray-800 text-center leading-tight max-w-[56px] line-clamp-2">
                {item.title}
              </span>
            </button>
          )}
        />
      )}
    </div>
  );
}
