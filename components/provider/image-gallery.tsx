"use client";
import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  profilePicture?: string;
  title?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = [],
  profilePicture,
  title = "Work Examples",
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine profile picture with portfolio images
  const allImages = profilePicture
    ? [profilePicture, ...images.filter((img) => img !== profilePicture)]
    : images;

  if (!allImages || allImages.length === 0) {
    return null;
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "Escape") setSelectedIndex(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
        {allImages.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setSelectedIndex(index);
            }}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 hover:border-blue-500 transition-all ${
              currentIndex === index ? "border-blue-500" : "border-gray-200"
            }`}
          >
            <Image
              src={image || "/default-service.svg"}
              alt={`${title} ${index + 1}`}
              fill
              className="object-cover object-top hover:scale-105 transition-transform"
              sizes="100px"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-service.svg";
              }}
            />
          </button>
        ))}
      </div>

      {/* Selected Image Preview */}
      <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
        <Image
          src={allImages[currentIndex] || "/default-service.svg"}
          alt={`${title} preview`}
          fill
          className="object-cover object-top"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-service.svg";
          }}
        />

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={allImages[selectedIndex] || "/default-service.svg"}
              alt="Full view"
              width={1200}
              height={800}
              className="w-full rounded-2xl object-cover max-h-[80vh]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-service.svg";
              }}
            />

            {/* Lightbox Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) =>
                      prev !== null ? (prev - 1 + allImages.length) % allImages.length : 0
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) =>
                      prev !== null ? (prev + 1) % allImages.length : 0
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
