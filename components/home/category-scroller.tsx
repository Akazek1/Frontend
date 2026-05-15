"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Scroller from "../scroller";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

interface Category {
  title: string;
}

const C = "145B10";

const ICON_MAP: Record<string, string> = {
  // Cleaning
  clean:    `https://img.icons8.com/ios/48/${C}/broom.png`,
  broom:    `https://img.icons8.com/ios/48/${C}/broom.png`,
  vacuum:   `https://img.icons8.com/ios/48/${C}/vacuum-cleaner.png`,
  // Cooking
  cook:     `https://img.icons8.com/ios/48/${C}/chef-hat.png`,
  chef:     `https://img.icons8.com/ios/48/${C}/chef-hat.png`,
  food:     `https://img.icons8.com/ios/48/${C}/restaurant.png`,
  // Childcare
  nanny:    `https://img.icons8.com/ios/48/${C}/nanny.png`,
  babysit:  `https://img.icons8.com/ios/48/${C}/baby-feet.png`,
  child:    `https://img.icons8.com/ios/48/${C}/baby-feet.png`,
  // Electrical
  electr:   `https://img.icons8.com/ios/48/${C}/electricity.png`,
  // Plumbing
  plumb:    `https://img.icons8.com/ios/48/${C}/plumber.png`,
  pipe:     `https://img.icons8.com/ios/48/${C}/plumbing.png`,
  // Painting
  paint:    `https://img.icons8.com/ios/48/${C}/roller-brush.png`,
  // Carpentry / Repairs
  carpen:   `https://img.icons8.com/ios/48/${C}/carpenter.png`,
  repair:   `https://img.icons8.com/ios/48/${C}/screwdriver.png`,
  handyman: `https://img.icons8.com/ios/48/${C}/wrench.png`,
  // Gardening
  garden:   `https://img.icons8.com/ios/48/${C}/garden.png`,
  plant:    `https://img.icons8.com/ios/48/${C}/potted-plant.png`,
  grass:    `https://img.icons8.com/ios/48/${C}/grass.png`,
  // Laundry
  laundry:  `https://img.icons8.com/ios/48/${C}/washing-machine.png`,
  // AC / Appliances
  ac:       `https://img.icons8.com/ios/48/${C}/air-conditioner.png`,
  air:      `https://img.icons8.com/ios/48/${C}/air-conditioner.png`,
  appli:    `https://img.icons8.com/ios/48/${C}/fan.png`,
  // Driving
  drive:    `https://img.icons8.com/ios/48/${C}/driver.png`,
  taxi:     `https://img.icons8.com/ios/48/${C}/taxi.png`,
  car:      `https://img.icons8.com/ios/48/${C}/car.png`,
  // Security
  guard:    `https://img.icons8.com/ios/48/${C}/security-guard.png`,
  secur:    `https://img.icons8.com/ios/48/${C}/shield.png`,
  // Pet
  pet:      `https://img.icons8.com/ios/48/${C}/dog.png`,
  dog:      `https://img.icons8.com/ios/48/${C}/dog.png`,
  // Tutoring
  tutor:    `https://img.icons8.com/ios/48/${C}/teacher.png`,
  teach:    `https://img.icons8.com/ios/48/${C}/school.png`,
  lesson:   `https://img.icons8.com/ios/48/${C}/book.png`,
  // Errands / Delivery
  errand:   `https://img.icons8.com/ios/48/${C}/shopping-basket.png`,
  deliv:    `https://img.icons8.com/ios/48/${C}/delivery.png`,
  shop:     `https://img.icons8.com/ios/48/${C}/shopping-cart.png`,
};

const DEFAULT_ICON = `https://img.icons8.com/ios/48/${C}/wrench.png`;

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

function getIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, url] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return url;
  }
  return DEFAULT_ICON;
}

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
      const response = await api.get("/services");
      const services = response.data.data;

      const seen = new Set<string>();
      const apiCategories: Category[] = [];

      interface Service {
        category: { name: string } | string;
      }

      services.forEach((service: Service) => {
        const title =
          typeof service.category === "object" ? service.category.name : service.category;
        if (title && !seen.has(title)) {
          seen.add(title);
          apiCategories.push({ title });
        }
      });

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
        <h2 className="text-[#1B2431] font-semibold text-[16px]">Services Categories</h2>
        <button
          onClick={() => router.push("/service?category=all")}
          className="text-[12px] text-[#145B10] font-semibold"
        >
          See all
        </button>
      </div>

      {isLoading ? (
        <div className="w-full flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
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
                  src={getIcon(item.title)}
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
