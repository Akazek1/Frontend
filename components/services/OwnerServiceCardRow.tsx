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
  /**
   * The worker's global `availableForWork` flag. This is the SOLE driver
   * of the card's "Available Today" vs "Unavailable" badge — independent
   * of the per-service `isActive` flag, which controls marketplace
   * visibility (not the badge). Defaults to true so a missing prop never
   * silently shows "Unavailable".
   */
  workerAvailable?: boolean;
}

/**
 * The owner-mode wrapper for the marketplace ServiceCard.
 *
 * Two distinct concepts live here:
 *
 * - Global `availableForWork` (worker-level) → drives the "Available
 *   Today" / "Unavailable" badge on every card the worker owns. When
 *   the worker turns it off, cards stay visible in the marketplace
 *   (and in the owner's My Services list) but the badge flips to
 *   "Unavailable".
 *
 * - Per-service `isActive` (card-level) → controls marketplace
 *   visibility. A deactivated card is HIDDEN from employers (backend
 *   filter) but still shown to the owner here, dimmed, with an
 *   Activate button to re-publish it.
 *
 * - "Request to Hire" inside the card auto-becomes a disabled "Your
 *   service" pill via the existing isOwnService prop.
 * - Bookmark inside the card is suppressed by the same prop.
 */
export function OwnerServiceCardRow({
  service,
  onEdit,
  onToggleActive,
  workerAvailable = true,
}: OwnerServiceCardRowProps) {
  const provider = mapServiceToProviderCard(service);
  const isActive = service.isActive !== false;

  // The marketplace card expects a single onClick for the whole card tap.
  // For the owner, tapping the card opens the edit screen.
  const handleCardClick = () => onEdit(service);

  return (
    <div
      className={`flex flex-col gap-2 ${isActive ? "" : "opacity-70"}`}
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
        available={workerAvailable}
        verified={provider.verified}
        onClick={handleCardClick}
        isOwnService
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(service)}
          className="flex-1 border-brand/30 text-brand hover:bg-surface"
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
            className="flex-1 bg-brand text-white hover:bg-brand-dark"
          >
            <Power className="h-4 w-4" />
            Activate
          </Button>
        )}
      </div>
    </div>
  );
}
