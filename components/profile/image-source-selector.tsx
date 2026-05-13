"use client";

import React from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageSourceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

const ImageSourceSelector: React.FC<ImageSourceSelectorProps> = ({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs w-[90vw] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Select Image Source</DialogTitle>
          <DialogDescription className="text-sm">
            Choose how you want to add your profile picture
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => {
              onSelectCamera();
              setTimeout(onClose, 100); // Small delay to ensure file input is triggered
            }}
            className="w-full h-14 flex items-center justify-center gap-3 bg-[#145B10] hover:bg-[#0F4D0C] active:bg-[#0F4D0C] transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>Take Photo</span>
          </Button>

          <Button
            onClick={() => {
              onSelectGallery();
              setTimeout(onClose, 100); // Small delay to ensure file input is triggered
            }}
            variant="outline"
            className="w-full h-14 flex items-center justify-center gap-3 border-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
            <span>Choose from Gallery</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSourceSelector;

