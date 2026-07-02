"use client";

import { useRouter } from "next/navigation";
import { Service } from "@/types";
import { getServiceDetailPath, getServiceDisplayName } from "@/lib/service-display";
import { getCategoryIcon } from "@/constant/category-icons";

export function ServicesGrid({ services }: { services: Service[] }) {
  const router = useRouter();
  if (!services || services.length === 0) return null;

  return (
    <section className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
      <h2 className="text-lg font-bold text-ink mb-4">Services I Offer</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {services.map((service) => {
          const categoryName = getServiceDisplayName(service);
          const iconUrl = getCategoryIcon(categoryName);

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => router.push(getServiceDetailPath(service))}
              className="flex flex-col items-start gap-2 bg-white border border-gray-200 rounded-xl px-3 py-3 text-left hover:border-brand hover:bg-[#F4F8F2] transition-colors min-h-[88px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconUrl} alt={categoryName} width={24} height={24} className="flex-shrink-0" />
              <span className="text-[13px] font-semibold text-ink leading-snug capitalize">{categoryName}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
