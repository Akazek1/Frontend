import Image from 'next/image';
import { Label } from './ui/label';

interface ImagePickerProps {
    onImageSelect?: (file: File) => void;
    onImagesSelect?: (files: File[]) => void;
    initialPreview?: string | null;
    initialPreviews?: string[];
    multiple?: boolean;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onImageSelect, onImagesSelect, initialPreview, initialPreviews, multiple = false }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const selectedFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
        if (selectedFiles.length === 0) return;
        const file = selectedFiles[0];
        if (!file.type.startsWith('image/')) return;
        onImageSelect?.(file); // Preview handled by parent
        onImagesSelect?.(selectedFiles);
    };

    const previews = initialPreviews?.length ? initialPreviews : initialPreview ? [initialPreview] : [];

    return (
        <div className="w-full max-w-sm">
            <Label className="font-semibold text-secondary-foreground/50 text-xs">Service Images</Label>
            <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-44 p-4 border-2 border-dashed border-gray-300 bg-white rounded-lg cursor-pointer hover:border-brand transition"
            >
                {previews.length > 0 ? (
                    <div className="grid h-full w-full grid-cols-3 gap-2">
                        {previews.slice(0, 6).map((preview, index) => (
                            <div key={preview + index} className="relative overflow-hidden rounded bg-gray-100">
                                <Image
                                    fill
                                    src={preview}
                                    alt={`Service preview ${index + 1}`}
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16l-4-4m0 0l4-4m-4 4h18"
                            />
                        </svg>
                        <p className="mt-2 text-brand">Click to upload service photos</p>
                    </div>
                )}
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    onChange={handleChange}
                    className="hidden"
                />
            </label>
        </div>
    );
};


export default ImagePicker;
