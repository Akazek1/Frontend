"use client";
import React, { useState, useRef, useEffect } from "react";
import { Verified } from "lucide-react";
import { Avatar, AvatarImage } from "../ui/avatar";
import api from "@/lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { updateUser } from "@/store/slices/auth-slice";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/error-handler";
import ImageSourceSelector from "./image-source-selector";
import { 
  optimizeImage, 
  createPreviewUrl, 
  revokePreviewUrl, 
  validateImageFile 
} from "@/utils/image-optimizer";
import ImageCropperModal from "./image-cropper-modal";

type ProfileImageUploaderProps = {
    className?: string;
};

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
    className = "",
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [showSourceSelector, setShowSourceSelector] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const { user } = useSelector((state: RootState) => state.auth);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) {
            setError("No file selected or user not authenticated");
            toast.error("Please select an image and ensure you are logged in");
            return;
        }

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error || "Invalid image file");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Optimize image before showing cropper (resize to max 800x800, compress)
            toast.loading("Optimizing image...", { id: "optimizing" });
            const optimizedFile = await optimizeImage(file, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.85,
                maxSizeMB: 0.5, // Target 500KB
            });
            toast.dismiss("optimizing");

            console.log("Image optimized:", {
                original: { size: file.size, name: file.name },
                optimized: { size: optimizedFile.size, name: optimizedFile.name },
                reduction: `${Math.round((1 - optimizedFile.size / file.size) * 100)}%`,
            });

            const previewUrl = createPreviewUrl(optimizedFile);
            setPreviewImage(previewUrl);
            setShowCropper(true);
        } catch (err) {
            console.error("Error processing image:", err);
            toast.dismiss("optimizing");
            toast.error(err instanceof Error ? err.message : "Failed to process image");
            setError(err instanceof Error ? err.message : "Failed to process image");
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (cameraInputRef.current) {
                cameraInputRef.current.value = '';
            }
        }
    };

    const handleCroppedImage = async (croppedImageBlob: Blob) => {
        if (!user?.id) {
            toast.error("User not authenticated");
            return;
        }

        // Validate blob
        if (!croppedImageBlob || croppedImageBlob.size === 0) {
            toast.error("Invalid image. Please try again.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setShowCropper(false);

        try {
            // Convert blob to File first
            const croppedFile = new File([croppedImageBlob], "profile-picture.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
            });

            // Further optimize the cropped image (should already be small, but ensure it's optimal)
            toast.loading("Finalizing image...", { id: "finalizing" });
            const finalFile = await optimizeImage(croppedFile, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.85,
                maxSizeMB: 0.5, // Target 500KB
            });
            toast.dismiss("finalizing");

            // Validate final file size (max 1MB after all optimization)
            const maxSize = 1 * 1024 * 1024; // 1MB
            if (finalFile.size > maxSize) {
                throw new Error("Image is still too large after optimization");
            }

            const formData = new FormData();
            formData.append("avatar", finalFile);

            console.log("Uploading optimized cropped image...", {
                original: croppedImageBlob.size,
                optimized: finalFile.size,
                reduction: `${Math.round((1 - finalFile.size / croppedImageBlob.size) * 100)}%`,
            });

            toast.loading("Uploading image...", { id: "uploading" });

            // Don't set Content-Type header - let axios set it automatically with boundary
            const response = await api.patch("/users/profile/image", formData);

            toast.dismiss("uploading");

            console.log("Upload response:", response.data);

            // The TransformInterceptor wraps the response, so structure is:
            // response.data = { data: { data: { profilePicture: "..." } }, statusCode, message, timestamp }
            const profilePicture = response.data?.data?.data?.profilePicture || response.data?.data?.profilePicture;

            if (profilePicture) {
                dispatch(updateUser({ profilePicture }));
                toast.success("Profile image updated successfully");
            } else {
                console.error("Unexpected response structure:", response.data);
                throw new Error("No image URL returned from server");
            }
        } catch (err: unknown) {
            console.error("Error updating profile image:", err);
            toast.dismiss("uploading");
            toast.dismiss("finalizing");
            
            const errorMessage = getApiErrorMessage(err, "Failed to update profile image");
            
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCloseCropper = () => {
        setShowCropper(false);
        // Clear preview when closing without saving
        if (previewImage) {
            revokePreviewUrl(previewImage);
            setPreviewImage(null);
        }
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewImage) {
                revokePreviewUrl(previewImage);
            }
        };
    }, [previewImage]);

    const handleAvatarClick = () => {
        if (isUploading) return;
        setError(null); // Clear any previous errors when opening source selector
        setShowSourceSelector(true);
    };

    const handleSelectCamera = () => {
        if (cameraInputRef.current && !isUploading) {
            // Ensure input is not disabled and can receive clicks
            cameraInputRef.current.click();
        }
    };

    const handleSelectGallery = () => {
        if (fileInputRef.current && !isUploading) {
            // Ensure input is not disabled and can receive clicks
            fileInputRef.current.click();
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div 
                onClick={handleAvatarClick}
                className={`relative cursor-pointer group ${className} ${isUploading ? "opacity-50" : ""}`}
            >
                <Avatar className={`w-[120px] h-[120px] ${isUploading ? "animate-pulse" : ""}`}>
                    <AvatarImage src={user?.profilePicture || "/images/user.png"} className="object-cover" />
                </Avatar>
                <div className="absolute right-2 -bottom-1  rounded-md flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M18.8316 0.512919C20.6298 0.400535 22.4029 1.02489 23.7391 2.24862C24.9628 3.58474 25.5872 5.35791 25.4873 7.16853V18.8315C25.5997 20.6421 24.9628 22.4153 23.7516 23.7514C22.4154 24.9751 20.6298 25.5995 18.8316 25.4871H7.16859C5.35795 25.5995 3.58477 24.9751 2.24864 23.7514C1.02489 22.4153 0.400535 20.6421 0.512919 18.8315V7.16853C0.400535 5.35791 1.02489 3.58474 2.24864 2.24862C3.58477 1.02489 5.35795 0.400535 7.16859 0.512919H18.8316ZM11.7264 19.0562L20.1303 10.6275C20.892 9.85325 20.892 8.60455 20.1303 7.84283L18.5069 6.21951C17.7327 5.44532 16.484 5.44532 15.7098 6.21951L14.8732 7.06864C14.7483 7.19351 14.7483 7.40579 14.8732 7.53066C14.8732 7.53066 16.8586 9.50362 16.8961 9.55357C17.0335 9.70341 17.1209 9.9032 17.1209 10.128C17.1209 10.5775 16.7587 10.9521 16.2967 10.9521C16.0844 10.9521 15.8846 10.8647 15.7473 10.7274L13.6619 8.6545C13.562 8.5546 13.3872 8.5546 13.2873 8.6545L7.33092 14.6108C6.91884 15.0229 6.68159 15.5723 6.6691 16.1592L6.59418 19.1187C6.59418 19.281 6.64413 19.4308 6.75651 19.5432C6.8689 19.6556 7.01874 19.718 7.18107 19.718H10.1156C10.7149 19.718 11.2894 19.4808 11.7264 19.0562Z" fill="#145B10" />
                    </svg>
                </div>
                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                />
                <input
                    ref={cameraInputRef}
                    id="profile-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                        handleFileSelect(e);
                        // Reset camera input so same image can be selected again
                        if (cameraInputRef.current) {
                            cameraInputRef.current.value = '';
                        }
                    }}
                    disabled={isUploading}
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold text-ink leading-[120%]">
                    {user?.firstName} {user?.lastName}
                </h2>
                {user?.isProfileComplete && (
                    <Verified className="w-5 h-5 fill-brand stroke-white" />
                )}
            </div>
            <p className="text-sm text-center text-[#212121] font-bold leading-[140%]">
                @{user?.username || "username"}
            </p>

            {/* Image Source Selector */}
            <ImageSourceSelector
                isOpen={showSourceSelector}
                onClose={() => setShowSourceSelector(false)}
                onSelectCamera={handleSelectCamera}
                onSelectGallery={handleSelectGallery}
            />

            <ImageCropperModal
                image={previewImage}
                isOpen={showCropper}
                onClose={handleCloseCropper}
                onSave={handleCroppedImage}
                aspect={1}
            />
        </div>
    );
};

export default ProfileImageUploader;
