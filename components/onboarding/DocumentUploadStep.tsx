"use client"

import React, { useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/error-handler"
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
}

export const DocumentUploadStep = ({
  onUploadSuccess,
  onCancel,
  isLoading = false,
}: DocumentUploadStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPEG and PNG images are allowed")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
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
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#145B10] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-[#F1FCEF] rounded-lg">
              <Upload className="w-8 h-8 text-[#145B10]" />
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
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
          disabled={isUploading || isLoading}
        >
          Back
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isLoading}
          className="flex-1 px-6 py-3 bg-[#145B10] text-white font-semibold rounded-lg hover:bg-[#0f4a0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Continue"}
        </button>
      </div>
    </div>
  )
}
