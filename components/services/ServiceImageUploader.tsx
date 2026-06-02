"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";

interface ServiceImageUploaderProps {
  existingUrls: string[];
  pendingFiles: File[];
  maxImages: number;
  onAdd: (files: File[]) => void;
  onRemoveAt: (index: number) => void;
}

export function ServiceImageUploader({
  existingUrls,
  pendingFiles,
  maxImages,
  onAdd,
  onRemoveAt,
}: ServiceImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = existingUrls.length + pendingFiles.length;
  const canAddMore = total < maxImages;

  // Build object URLs for the in-memory File previews. Revoke them on unmount
  // and whenever the file list changes to avoid leaking blob URLs.
  const fileBlobUrls = useMemo(
    () => pendingFiles.map((f) => URL.createObjectURL(f)),
    [pendingFiles],
  );

  useEffect(() => {
    return () => {
      fileBlobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fileBlobUrls]);

  const slots = [
    ...existingUrls.map((url, i) => ({ key: `e-${i}-${url}`, src: url, isFile: false })),
    ...fileBlobUrls.map((url, i) => ({ key: `f-${i}-${url}`, src: url, isFile: true })),
  ];

  const handlePicked = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (next.length > 0) onAdd(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot, idx) => (
          <div
            key={slot.key}
            className="relative aspect-square overflow-hidden rounded-xl border border-[#DCEEDD] bg-[#F1FCEF]"
          >
            <Image
              src={slot.src}
              alt={`Service image ${idx + 1}`}
              fill
              sizes="(max-width: 480px) 25vw, 96px"
              className="object-cover"
              unoptimized={slot.isFile}
            />
            <button
              type="button"
              onClick={() => onRemoveAt(idx)}
              aria-label={`Remove image ${idx + 1}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#FF3D00] shadow-sm hover:bg-[#FFF2EE]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#145B10]/40 bg-white text-[#145B10] hover:bg-[#F1FCEF]"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[11px] font-semibold">Add</span>
          </button>
        )}
      </div>

      <p className="mt-2 text-[11px] text-[#667085]">
        Up to {maxImages} images. The first image is your card&apos;s main photo.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handlePicked(e.target.files)}
      />
    </div>
  );
}
