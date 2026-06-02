"use client";

import { Pencil, PowerOff, Power } from "lucide-react";
import ServiceCard from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { mapServiceToProviderCard } from "@/lib/service-display";
import type { Service } from "@/types";

interface OwnerServiceCardRowProps {
  service: Service;
  onEdit: (service: Service) => void;
  /**
   * Fires when the owner taps Deactivate or Activate. The caller is
   * responsible for surfacing the DeactivateServiceDialog and calling
   * the API.
   */
  onToggleActive: (service: Service) => void;
}

/**
 * The owner-mode wrapper for the marketplace ServiceCard.
 *
 * Renders the existing public service-card component verbatim (so we
 * stay visually identical to what employers see), and adds Edit /
 * Deactivate buttons below.
 *
 * - "Request to Hire" inside the card auto-becomes a disabled "Your
 *   service" pill via the existing isOwnService prop.
 * - Bookmark inside the card is suppressed by the same prop.
 * - Deactivated cards (isActive=false) show with reduced opacity and
 *   swap the Deactivate button for an Activate button.
 */
export function OwnerServiceCardRow({
  service,
  onEdit,
  onToggleActive,
}: OwnerServiceCardRowProps) {
  const provider = mapServiceToProviderCard(service);
  const isActive = service.isActive !== false;

  // The marketplace card expects a single onClick for the whole card tap.
  // For the owner, tapping the card opens the edit screen.
  const handleCardClick = () => onEdit(service);

  return (
    <div
      className={`flex flex-col gap-2 ${
        isActive ? "" : "opacity-70"
      }`}
      aria-label={
        isActive ? "Your active service card" : "Your deactivated service card"
      }
    >
      <ServiceCard
        id={provider.id}
        image={provider.image}
        profileImage={provider.profileImage}
        name={provider.name}
        handle={provider.handle}
        title={provider.title}
        experience={provider.experience}
        languages={provider.languages}
        location={provider.location}
        price={provider.price}
        rating={provider.rating}
        reviews={provider.reviews}
        distance={provider.distance}
        available={isActive && provider.available}
        verified={provider.verified}
        onClick={handleCardClick}
        isOwnService
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(service)}
          className="flex-1 border-[#145B10]/30 text-[#145B10] hover:bg-[#F1FCEF]"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        {isActive ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onToggleActive(service)}
            className="flex-1 border-[#FF3D00]/30 text-[#FF3D00] hover:bg-[#FFF2EE]"
          >
            <PowerOff className="h-4 w-4" />
            Deactivate
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => onToggleActive(service)}
            className="flex-1 bg-[#145B10] text-white hover:bg-[#0F4D0C]"
          >
            <Power className="h-4 w-4" />
            Activate
          </Button>
        )}
      </div>
    </div>
  );
}
