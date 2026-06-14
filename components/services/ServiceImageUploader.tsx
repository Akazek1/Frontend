"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Plus, X } from "lucide-react";
import imageCompression from "browser-image-compression";

const MAX_INPUT_MB = 5;
const COMPRESS_OPTIONS = {
  maxSizeMB: 0.3,        // target ≤ 300 KB per photo
  maxWidthOrHeight: 1280, // enough for any service card or lightbox view
  useWebWorker: true,
};

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
  const [isCompressing, setIsCompressing] = useState(false);
  const total = existingUrls.length + pendingFiles.length;
  const canAddMore = total < maxImages;

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

  const handlePicked = async (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    const tooBig = images.filter((f) => f.size > MAX_INPUT_MB * 1024 * 1024);
    if (tooBig.length > 0) {
      alert(
        `${tooBig.length} photo${tooBig.length > 1 ? "s" : ""} exceed the ${MAX_INPUT_MB} MB limit and were skipped.`,
      );
    }
    const valid = images.filter((f) => f.size <= MAX_INPUT_MB * 1024 * 1024);
    if (inputRef.current) inputRef.current.value = "";
    if (valid.length === 0) return;

    setIsCompressing(true);
    try {
      const compressed = await Promise.all(
        valid.map((f) => imageCompression(f, COMPRESS_OPTIONS)),
      );
      onAdd(compressed);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot, idx) => (
          <div
            key={slot.key}
            className="relative aspect-square overflow-hidden rounded-xl border border-[#DCEEDD] bg-surface"
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
            onClick={() => !isCompressing && inputRef.current?.click()}
            disabled={isCompressing}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand/40 bg-white text-brand hover:bg-surface disabled:opacity-60"
          >
            {isCompressing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[10px] font-semibold">Optimizing…</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="mt-2 text-[11px] text-ink-subtle">
        Up to {maxImages} images · max {MAX_INPUT_MB} MB each. The first image is your card&apos;s main photo.
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
