"use client"

import React, { useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/error-handler"
import { optimizeImage, validateImageFile } from "@/utils/image-optimizer"
import Image from "next/image"

interface UploadedDocument {
  id: string
  type: string
  url: string
  [key: string]: unknown
}

interface UploadDocumentResponse {
  data?: {
    document?: UploadedDocument
  }
  document?: UploadedDocument
}

interface DocumentUploadStepProps {
  onUploadSuccess: (document: UploadedDocument) => void
  onCancel: () => void
  isLoading?: boolean
  /** Hide the secondary Back/Cancel button. Used in onboarding where the
   *  account already exists, so there is nothing to go "back" to. */
  showBack?: boolean
  /** Label for the secondary button when shown (e.g. "Back" or "Cancel"). */
  backLabel?: string
}

export const DocumentUploadStep = ({
  onUploadSuccess,
  onCancel,
  isLoading = false,
  showBack = true,
  backLabel = "Back",
}: DocumentUploadStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (file: File) => {
    // Validate (accepts common image types up to 10MB before optimization).
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image file")
      return
    }

    try {
      // Compress/resize large photos down to a small JPEG before upload — the
      // same approach used for service images and profile pictures. Keeps ID
      // text legible (1600px) while staying well under the 5MB server limit.
      toast.loading("Optimizing image...", { id: "doc-optimizing" })
      const optimized = await optimizeImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        maxSizeMB: 1, // Target ~1MB
      })
      toast.dismiss("doc-optimizing")

      setSelectedFile(optimized)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(optimized)
    } catch (err) {
      toast.dismiss("doc-optimizing")
      toast.error(err instanceof Error ? err.message : "Failed to process image")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await api.post<UploadDocumentResponse>("/documents/upload/government-id", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      })

      const payload = response.data?.data || response.data
      if (!payload.document) {
        throw new Error("No document returned from server")
      }
      toast.success("ID received. Our team will verify within 24 hours.")
      onUploadSuccess(payload.document)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(getApiErrorMessage(error, "Failed to upload document"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
          Upload National ID, Passport, or Driver&apos;s License
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          We need to verify your identity to connect you with employers
        </p>
      </div>

      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-surface rounded-lg">
              <Upload className="w-8 h-8 text-brand" />
            </div>
          </div>
          <p className="text-gray-900 font-semibold mb-1">
            Tap to upload or drag and drop
          </p>
          <p className="text-sm text-gray-600 mb-4">
            PNG or JPG (up to 5MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 h-80">
            <Image
              src={preview}
              alt="Preview"
              fill
              unoptimized
              className="object-cover"
            />
            <button
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center">
            {selectedFile?.name}
          </p>
        </div>
      )}

      <div className="flex gap-4 mt-8">
        {showBack && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
            disabled={isUploading || isLoading}
          >
            {backLabel}
          </button>
        )}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isLoading}
          className="flex-1 px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-[#0f4a0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Continue"}
        </button>
      </div>
    </div>
  )
}
