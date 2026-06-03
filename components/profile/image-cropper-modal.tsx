"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn } from "lucide-react";

interface ImageCropperModalProps {
  image: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageBlob: Blob) => void;
  aspect?: number;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  image,
  isOpen,
  onClose,
  onSave,
  aspect = 1, // Square by default for profile pictures
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number; naturalWidth: number; naturalHeight: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      console.log("Crop complete:", {
        croppedArea, // percentage-based
        croppedAreaPixels, // pixel-based
        currentZoom: zoom,
        currentRotation: rotation,
        currentCrop: crop,
        imageSize,
        // Check if coordinates seem valid
        isValid: 
          croppedAreaPixels.width > 0 && 
          croppedAreaPixels.height > 0 &&
          croppedAreaPixels.x >= -croppedAreaPixels.width &&
          croppedAreaPixels.y >= -croppedAreaPixels.height,
      });
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [zoom, rotation, crop, imageSize]
  );

  // Get image dimensions when image loads and reset state with centered crop
  React.useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        // Reset all state for new image
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);
        setMediaSize(null);
      };
      img.src = image;
    }
  }, [image]);

  // Capture media size from react-easy-crop and auto-adjust zoom to fit
  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number; naturalWidth: number; naturalHeight: number }) => {
    console.log("Media loaded in react-easy-crop:", mediaSize);
    setMediaSize(mediaSize);

    // Auto-adjust zoom to show the entire image initially if it's very large
    if (mediaSize.width > 1200 || mediaSize.height > 1200) {
      const fitZoom = Math.min(
        1000 / mediaSize.width,
        1000 / mediaSize.height,
        1
      );
      if (fitZoom < 1) {
        setZoom(Math.max(0.3, fitZoom));
      }
    }
  }, []);

  // Simple, reliable image cropping function
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  // Simple, direct cropping - use coordinates exactly as react-easy-crop provides
  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Verify image dimensions match what we expect
    console.log("getCroppedImg - Image dimensions:", {
      imageWidth: image.width,
      imageHeight: image.height,
      pixelCrop,
      rotation,
      // Check if crop coordinates are reasonable
      cropWithinBounds: 
        pixelCrop.x >= 0 && 
        pixelCrop.y >= 0 && 
        pixelCrop.x + pixelCrop.width <= image.width &&
        pixelCrop.y + pixelCrop.height <= image.height,
      // Check crop center
      cropCenter: {
        x: pixelCrop.x + pixelCrop.width / 2,
        y: pixelCrop.y + pixelCrop.height / 2,
      },
      imageCenter: {
        x: image.width / 2,
        y: image.height / 2,
      },
    });

    // Set canvas to exact crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (rotation === 0) {
      // No rotation - use coordinates EXACTLY as react-easy-crop provides
      // Trust react-easy-crop's coordinate calculation completely
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
    } else {
      // With rotation - need to rotate first, then crop
      const rotRad = (rotation * Math.PI) / 180;
      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      // Create temporary canvas for rotation
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("No 2d context");

      tempCanvas.width = safeArea;
      tempCanvas.height = safeArea;

      // Rotate image around center
      tempCtx.translate(safeArea / 2, safeArea / 2);
      tempCtx.rotate(rotRad);
      tempCtx.translate(-safeArea / 2, -safeArea / 2);
      tempCtx.drawImage(
        image,
        safeArea / 2 - image.width / 2,
        safeArea / 2 - image.height / 2
      );

      // Transform crop coordinates from natural image space to rotated canvas space
      const imageCenterX = image.width / 2;
      const imageCenterY = image.height / 2;
      const cropCenterX = pixelCrop.x + pixelCrop.width / 2;
      const cropCenterY = pixelCrop.y + pixelCrop.height / 2;
      
      const relativeX = cropCenterX - imageCenterX;
      const relativeY = cropCenterY - imageCenterY;
      
      const cos = Math.cos(rotRad);
      const sin = Math.sin(rotRad);
      const rotatedX = relativeX * cos - relativeY * sin;
      const rotatedY = relativeX * sin + relativeY * cos;
      
      const rotatedCenterX = safeArea / 2 + rotatedX;
      const rotatedCenterY = safeArea / 2 + rotatedY;
      
      const sourceX = rotatedCenterX - pixelCrop.width / 2;
      const sourceY = rotatedCenterY - pixelCrop.height / 2;

      // Extract crop from rotated image
      ctx.drawImage(
        tempCanvas,
        sourceX,
        sourceY,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
    }

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSave = async () => {
    if (!image || !imageSize) {
      console.error("Missing required data:", { image: !!image, imageSize: !!imageSize });
      return;
    }

    // Wait to ensure onCropComplete has fired
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!croppedAreaPixels) {
      console.error("Missing crop area");
      alert("Please wait a moment and try again.");
      return;
    }

    setIsProcessing(true);
    try {
      // Use react-easy-crop's croppedAreaPixels directly
      // It should already be in natural image coordinates
      console.log("Saving with react-easy-crop coordinates:", {
        croppedAreaPixels,
        imageSize,
        mediaSize,
        crop,
        zoom,
        rotation,
        cropCenter: {
          x: croppedAreaPixels.x + croppedAreaPixels.width / 2,
          y: croppedAreaPixels.y + croppedAreaPixels.height / 2,
        },
        imageCenter: {
          x: imageSize.width / 2,
          y: imageSize.height / 2,
        },
      });

      // Use react-easy-crop's croppedAreaPixels directly
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation
      );
      
      // Validate the cropped image
      if (!croppedImage || croppedImage.size === 0) {
        throw new Error("Failed to crop image. Please try again.");
      }

      console.log("Cropped image created:", {
        size: croppedImage.size,
        type: croppedImage.type,
      });

      onSave(croppedImage);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
      alert(error instanceof Error ? error.message : "Failed to crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] sm:w-[90vw] md:w-[500px] p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base sm:text-lg">Edit Profile Picture</DialogTitle>
          <DialogDescription className="text-xs">
            Adjust, crop, and center your image. Click save when you&apos;re happy with it.
          </DialogDescription>
        </DialogHeader>

        <div ref={containerRef} className="relative w-full h-[250px] sm:h-[300px] bg-gray-100 flex items-center justify-center overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            cropShape="round"
            showGrid={false}
            minZoom={0.3}
            maxZoom={3}
            restrictPosition={true}
            objectFit="cover"
            style={{
              containerStyle: {
                backgroundColor: '#f3f4f6',
                width: '100%',
                height: '100%',
              },
              mediaStyle: {
                maxWidth: 'none',
                maxHeight: 'none',
              },
            }}
          />
        </div>

        <div className="px-4 space-y-3 pb-4">
          {/* Zoom Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom</span>
              </div>
              <span className="text-gray-500 text-xs">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={0.3}
              max={3}
              step={0.05}
              onValueChange={(value) => setZoom(value[0])}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotation</span>
              </div>
              <span className="text-gray-500 text-xs">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={(value) => setRotation(value[0])}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="px-4 pb-4 gap-2 flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={isProcessing}
            className="w-full sm:w-auto text-sm"
          >
            Reset
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isProcessing}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing}
            className="bg-[#145B10] hover:bg-[#145B10]/90 w-full sm:w-auto text-sm"
          >
            {isProcessing ? "Processing..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropperModal;
