/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { type FormEvent, useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Eye, Loader2, Pencil, Trash2 } from "lucide-react"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import ImagePicker from "../image-picker"
import ServiceCard from "../service-card"
import { isEmployer } from "@/lib/roles"

// Service interface for services fetched from or sent to the backend
interface Service {
  id: string
  description: string
  price?: number
  priceMin?: number | null
  priceMax?: number | null
  priceType?: string | null
  category: { id: string; name: string } | string
  scopeOfService: string
  areaServed?: string
  serviceImage: string | null
  serviceImages?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  provider: {
    id: string
    firstName: string
    lastName: string
    email: string
    roles?: string[]
    isVerified?: boolean
  }
  providerId: string
  worker: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  workerId: string | null
  serviceAreas: string[]
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
}

// IndividualData interface for form data
interface IndividualData {
  category: string
  price: number
  scopeOfService: string
  areaServed?: string
  title: string
  serviceImage: File | string | null
  serviceImages: (File | string)[]
  workerId?: string // Added workerId field
}

interface Category {
  id: string
  name: string
}

// ServiceFormProps interface for the ServiceForm component
interface ServiceFormProps {
  initialData: IndividualData
  onSubmit: (e: FormEvent) => Promise<void>
  submitting: boolean
  setData: React.Dispatch<React.SetStateAction<IndividualData>>
  onCancel?: () => void
  isWorker: boolean
}

// ServiceForm component
const ServiceForm: React.FC<ServiceFormProps> = ({
  initialData,
  onSubmit,
  submitting,
  setData,
  onCancel,
  isWorker,
}) => {
  const t = useTranslations("individualForm")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [workerList, setWorkerList] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(initialData.workerId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await api.get("/services/categories")
        const categoryData = response.data?.data || response.data || []
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch {
        toast.error(t("failedLoadCategories"))
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const getAgencyWorker = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await api.get("/agency/workers")
        if (response.data && response.data.data) {
          setWorkerList(response.data.data)
        } else {
          throw new Error(t("invalidWorkerResponse"))
        }
      } catch (err) {
        // Gracefully handle missing endpoint or authorization errors
        const errorStatus = (err as any)?.response?.status
        if (errorStatus === 404 || errorStatus === 403) {
          // Endpoint not found or not authorized — don't show error, just skip worker list
          console.warn("Agency worker endpoint not available")
          setWorkerList([])
          setError(null)
        } else {
          console.error("Error fetching workers:", err)
          setError(
            typeof err === "object" && err !== null && "message" in err
              ? (err as { message?: string }).message || t("fetchWorkersFailed")
              : t("fetchWorkersFailed"),
          )
          setWorkerList([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (isWorker) {
      getAgencyWorker()
    }
  }, [isWorker])

  useEffect(() => {
    const sourceImages = initialData.serviceImages.length > 0 ? initialData.serviceImages : initialData.serviceImage ? [initialData.serviceImage] : []
    if (sourceImages.length === 0) {
      setImagePreview(null)
      setImagePreviews([])
      return
    }

    Promise.all(
      sourceImages.map(
        (image) =>
          new Promise<string>((resolve) => {
            if (typeof image === "string") {
              resolve(image)
              return
            }

            const reader = new FileReader()
            reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "")
            reader.readAsDataURL(image)
          }),
      ),
    ).then((previews) => {
      const nextPreviews = previews.filter(Boolean)
      setImagePreviews(nextPreviews)
      setImagePreview(nextPreviews[0] || null)
    })
  }, [initialData.serviceImage, initialData.serviceImages])

  const handleImageSelect = (file: File) => {
    setData((prev) => ({ ...prev, serviceImage: file, serviceImages: [file] }))
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImagesSelect = (files: File[]) => {
    setData((prev) => ({ ...prev, serviceImage: files[0] || null, serviceImages: files }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isWorker && (
        <>
          {isLoading && <div className="text-sm text-gray-500">{t("loadingWorkers")}</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!isLoading && !error && workerList.length === 0 && (
            <div className="text-sm text-gray-500">{t("noWorkersAvailable")}</div>
          )}
          {!isLoading && !error && workerList.length > 0 && (
            <div className="space-y-0.5">
              <Label className="font-semibold text-secondary-foreground/50 text-xs">{t("selectWorker")}</Label>
              <Select
                value={selectedWorkerId}
                onValueChange={(value) => {
                  setSelectedWorkerId(value)
                  setData((prev) => ({ ...prev, workerId: value }))
                }}
              >
                <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-2 focus:ring-brand w-full">
                  <SelectValue placeholder={t("selectWorker")} />
                  <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 top-1/2 -translate-y-1/2 transition-transform duration-300" />
                </SelectTrigger>
                <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
                  {workerList.map((worker) => (
                    <SelectItem
                      key={worker.id}
                      value={worker.id}
                      className="text-sm font-semibold whitespace-normal break-words px-4 py-2"
                    >
                      {worker.firstName} {worker.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      <ImagePicker onImageSelect={handleImageSelect} onImagesSelect={handleImagesSelect} initialPreview={imagePreview} initialPreviews={imagePreviews} multiple />

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">{t("serviceTitle")}</Label>
        <Input
          value={initialData.title}
          onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder={t("serviceTitlePlaceholder")}
          className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">{t("serviceCategory")}</Label>
        <Select
          value={initialData.category}
          onValueChange={(value) => {
            const category = categories.find((item) => item.id === value)
            setData((prev) => ({ ...prev, category: value, title: category?.name || prev.title }))
          }}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-2 focus:ring-brand w-full">
            <SelectValue placeholder={t("selectService")} />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 top-1/2 -translate-y-1/2 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
            {loadingCategories && (
              <SelectItem value="loading" disabled>
                {t("loadingCategories")}
              </SelectItem>
            )}
            {!loadingCategories && categories.map((service) => (
              <SelectItem
                key={service.id}
                value={service.id}
                className="text-sm font-semibold whitespace-normal break-words px-4 py-2"
              >
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">{t("servicePrice")}</Label>
        <Select
          value={
            initialData?.price && ["1500", "4500", "8000"].includes(initialData.price.toString())
              ? initialData.price.toString()
              : ""
          }
          onValueChange={(value) => setData((prev) => ({ ...prev, price: Number.parseInt(value) }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-brand">
            <SelectValue placeholder={t("selectPrice")} />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1500" className="text-sm font-semibold">
              {t("priceRangeOption", { min: 1000, max: 2000 })}
            </SelectItem>
            <SelectItem value="4500" className="text-sm font-semibold">
              {t("priceRangeOption", { min: 3000, max: 6000 })}
            </SelectItem>
            <SelectItem value="8000" className="text-sm font-semibold">
              {t("priceRangeOption", { min: 6000, max: 10000 })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">{t("areaOfService")}</Label>
        <Select
          value={initialData.areaServed}
          onValueChange={(value) => setData((prev) => ({ ...prev, areaServed: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-brand">
            <SelectValue placeholder={t("areaOfServicePlaceholder")} />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="text-sm font-semibold" value="kigali">
              Kigali
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="nyarugenge">
              Nyarugenge
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="gasabo">
              Gasabo
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="kicukiro">
              Kicukiro
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="all">
              {t("allAreas")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">{t("serviceDescription")}</Label>
        <Textarea
          value={initialData.scopeOfService}
          onChange={(e) => setData((prev) => ({ ...prev, scopeOfService: e.target.value }))}
          placeholder={t("serviceDescriptionPlaceholder")}
          rows={5}
          className="bg-white text-sm font-medium rounded-lg px-5 py-4 border-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex space-x-2">
        <Button
          size="lg"
          type="submit"
          className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 h-12 hover:bg-brand-dark transition-colors"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <span className="inline-flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("previewCard")}
            </span>
          )}
        </Button>
        {onCancel && (
          <Button
            size="lg"
            type="button"
            variant="outline"
            className="w-full rounded-full h-13 bg-transparent"
            onClick={onCancel}
            disabled={submitting}
          >
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  )
}

// IndividualForm component
const IndividualForm = ({ isWorker }: { isWorker: boolean }) => {
  const t = useTranslations("individualForm")
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [draftPreviewImage, setDraftPreviewImage] = useState<string | null>(null)
  const { user } = useSelector((state: RootState) => state.auth)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string | null>>({})
  const previewUser = user as typeof user & {
    isVerified?: boolean
    languages?: string[]
  }

  const getCategoryName = (category: Service["category"]) =>
    typeof category === "object" ? category?.name || "" : category || ""

  const getPriceRange = (price: number) => {
    if (price === 1500) return { priceMin: 1000, priceMax: 2000 }
    if (price === 4500) return { priceMin: 3000, priceMax: 6000 }
    if (price === 8000) return { priceMin: 6000, priceMax: 10000 }
    return { priceMin: price, priceMax: price }
  }

  const getPriceOptionFromService = (service: Service) => {
    if (service.price) return service.price
    if (service.priceMin === 1000 && service.priceMax === 2000) return 1500
    if (service.priceMin === 3000 && service.priceMax === 6000) return 4500
    if (service.priceMin === 6000 && service.priceMax === 10000) return 8000
    return Number(service.priceMin ?? service.priceMax ?? 0)
  }

  const getServiceAreas = (areaServed?: string) => {
    if (!areaServed) return []
    if (areaServed === "all") return ["Kigali", "Nyarugenge", "Gasabo", "Kicukiro"]
    return areaServed
      .split(",")
      .map((area) => area.trim())
      .filter(Boolean)
      .map((area) => area.charAt(0).toUpperCase() + area.slice(1))
  }

  const formatServicePrice = (service: Service) => {
    const min = service.priceMin ?? service.price
    const max = service.priceMax ?? service.price
    if (!min && !max) return t("negotiable")
    if (min && max && min !== max) return t("priceRangeDisplay", { min, max })
    // One of min/max is guaranteed truthy by the checks above.
    return t("singlePriceDisplay", { price: (min || max) as number })
  }

  const formatDraftPrice = (price: number) => {
    const { priceMin, priceMax } = getPriceRange(price)
    if (!priceMin && !priceMax) return t("negotiable")
    if (priceMin !== priceMax) return t("priceRangeDisplay", { min: priceMin, max: priceMax })
    return t("singlePriceDisplay", { price: priceMin })
  }

  const getDraftPreviewImage = async (data: IndividualData) => {
    const image = data.serviceImages[0] || data.serviceImage
    if (!image) return null
    if (typeof image === "string") return image

    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "")
      reader.readAsDataURL(image)
    })
  }

  const validateServiceDraft = (data: IndividualData) => {
    if (!data.title.trim()) {
      toast.error(t("validateTitleRequired"))
      return false
    }

    if (!data.category) {
      toast.error(t("validateCategoryRequired"))
      return false
    }

    if (!data.price || data.price < 0) {
      toast.error(t("validatePriceRequired"))
      return false
    }

    if (!data.areaServed) {
      toast.error(t("validateAreaRequired"))
      return false
    }

    if (!data.scopeOfService.trim()) {
      toast.error(t("validateDescriptionRequired"))
      return false
    }

    return true
  }

  const [individualData, setIndividualData] = useState<IndividualData>({
    category: "",
    price: 0,
    scopeOfService: "",
    areaServed: "",
    title: "",
    serviceImage: null,
    serviceImages: [],
    workerId: "", // Added workerId to initial state
  })

  const [updateData, setUpdateData] = useState<Record<string, IndividualData>>({})

  // Exponential backoff retry mechanism
  async function retryWithBackoff<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
    let lastError: Error | null = null
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const status =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined
        if (status === 429 || (typeof status === "number" && status >= 500)) {
          const delay = baseDelay * Math.pow(2, i)
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          throw error
        }
      }
    }
    throw lastError || new Error("Retry failed")
  }

  // Fetch services for the logged-in user
  useEffect(() => {
    const fetchServices = async () => {
      if (!user?.id) return

      setLoadingServices(true)
      try {
        const response = await retryWithBackoff(() => api.get(`/services?providerId=${user.id}`))
        const fetchedServices = response.data.data || []

        setServices(fetchedServices)
        const previews: Record<string, string | null> = {}
        fetchedServices.forEach((service: Service) => {
          previews[service.id] = service.serviceImages?.[0] || service.serviceImage
        })
        setImagePreviews(previews)
      } catch {
        toast.error(t("failedFetchServices"))
      } finally {
        setLoadingServices(false)
      }
    }

    fetchServices()
  }, [user?.id])

  // Initialize update form data for a service
  const initializeUpdateData = (service: Service) => {
    // Set form state (no image File initially)
        setUpdateData((prev: any) => ({
      ...prev,
      [service.id]: {
        category: (typeof service.category === "object" ? service.category?.id : "") || "",
        price: getPriceOptionFromService(service),
        scopeOfService: service.description || "",
        areaServed: Array.isArray(service.serviceAreas) ? service.serviceAreas.join(", ") : service.areaServed || "",
        title: getCategoryName(service.category),
        serviceImage: service.serviceImage,
        serviceImages: service.serviceImages || [],
        workerId: service.workerId || "", // Include workerId in update data
      },
    }))

    // Set preview image (string URL from server)
    setImagePreviews((prev) => ({
      ...prev,
      [service.id]: service.serviceImages?.[0] || service.serviceImage || "",
    }))
  }

  // Handle edit button click
  const handleEditClick = (service: Service) => {
    initializeUpdateData(service)
    setEditingServiceId(service.id)
    setEditModalOpen(true)
  }

  // Handle service creation
  const handleServicePreview = async (e: FormEvent) => {
    e.preventDefault()

    // if (user?.isProfileComplete) {
    //   toast.error("Please complete your profile first.")
    //   return
    // }

    if (!validateServiceDraft(individualData)) {
      return
    }

    const previewImage = await getDraftPreviewImage(individualData)
    setDraftPreviewImage(previewImage)
    setPreviewOpen(true)
  }

  const saveServiceDraft = async () => {
    if (!validateServiceDraft(individualData)) return

    setSubmitting(true)
    const { priceMin, priceMax } = getPriceRange(individualData.price)
    const servicePayload = {
      categoryId: individualData.category,
      priceMin,
      priceMax,
      priceType: "daily",
      description: individualData.scopeOfService,
      serviceAreas: getServiceAreas(individualData.areaServed),
      title: individualData.title || t("householdServiceFallback"),
    }
    const imageFiles = individualData.serviceImages.filter((image): image is File => image instanceof File)

    try {
      const response = await retryWithBackoff(() => {
        if (imageFiles.length === 0) {
          return api.post("/services", servicePayload)
        }

        const formData = new FormData()
        Object.entries(servicePayload).forEach(([key, value]) => {
          formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value))
        })
        imageFiles.forEach((image) => formData.append("serviceImages", image))
        if (individualData.serviceImage instanceof File) {
          formData.append("serviceImage", individualData.serviceImage)
        }

        return api.post("/services", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      })

      toast.success(t("serviceSubmitted"))
      const newService = response.data.data
      setServices([...services, newService])
      setIndividualData({
        category: "",
        price: 0,
        scopeOfService: "",
        areaServed: "",
        title: "",
        serviceImage: null,
        serviceImages: [],
        workerId: "", // Reset workerId
      })
      setImagePreviews((prev) => ({
        ...prev,
        [newService.id]: newService.serviceImages?.[0] || newService.serviceImage,
      }))
      setPreviewOpen(false)
      setDraftPreviewImage(null)
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : t("failedSubmitService")
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle service update
  const handleUpdateService = async (e: FormEvent, serviceId: string) => {
    e.preventDefault()
    setSubmitting(true)

    const data = updateData[serviceId]
    if (!data) return

    const price = Number(data.price)
    if (isNaN(price) || price < 0) {
      toast.error(t("validatePriceInvalid"))
      setSubmitting(false)
      return
    }

    const { priceMin, priceMax } = getPriceRange(price)
    const servicePayload = {
      categoryId: data.category,
      priceMin,
      priceMax,
      priceType: "daily",
      description: data.scopeOfService,
      serviceAreas: getServiceAreas(data.areaServed),
      title: data.title || getCategoryName(services.find((service) => service.id === serviceId)?.category || ""),
    }
    const imageFiles = data.serviceImages.filter((image): image is File => image instanceof File)

    try {
      const response = await retryWithBackoff(() => {
        if (imageFiles.length === 0 && !(data.serviceImage instanceof File)) {
          return api.patch(`/services/${serviceId}`, servicePayload)
        }

        const formData = new FormData()
        formData.append("data", JSON.stringify(servicePayload))
        imageFiles.forEach((image) => formData.append("serviceImages", image))
        if (data.serviceImage instanceof File) {
          formData.append("serviceImage", data.serviceImage)
        }

        return api.patch(`/services/${serviceId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      })

      toast.success(t("serviceUpdated"))
      const updatedService = response.data?.data || response.data
      setServices(
        services.map((service) =>
          service.id === serviceId
            ? {
              ...service,
              ...updatedService,
              price: price,
              scopeOfService: data.scopeOfService,
              areaServed: data.areaServed,
              title: updatedService.title || data.title,
              serviceImage: updatedService.serviceImage || service.serviceImage,
              serviceImages: updatedService.serviceImages || service.serviceImages,
              workerId: data.workerId || service.workerId, // Update workerId
            }
            : service,
        ),
      )

      setImagePreviews((prev) => ({
        ...prev,
        [serviceId]: updatedService.serviceImages?.[0] || updatedService.serviceImage || prev[serviceId],
      }))

      setEditModalOpen(false)
      setEditingServiceId(null)
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : t("failedUpdateService")
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle service deletion
  const handleDeleteService = async () => {
    if (!serviceToDelete) return

    try {
      await retryWithBackoff(() => api.delete(`/services/${serviceToDelete}`))
      toast.success(t("serviceDeleted"))
      setServices(services.filter((service) => service.id !== serviceToDelete))
      setImagePreviews((prev) => {
        const newPreviews = { ...prev }
        delete newPreviews[serviceToDelete]
        return newPreviews
      })
      setDeleteModalOpen(false)
      setServiceToDelete(null)
    } catch {
      toast.error(t("failedDeleteService"))
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (serviceId: string) => {
    setServiceToDelete(serviceId)
    setDeleteModalOpen(true)
  }

  return (
    <div className="space-y-8">
      <ServiceForm
        initialData={individualData}
        onSubmit={handleServicePreview}
        submitting={submitting}
        setData={setIndividualData}
        isWorker={isWorker}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[92%] max-w-[520px]">
          <DialogHeader className="text-start">
            <DialogTitle>{t("previewServiceCard")}</DialogTitle>
            <DialogDescription>
              {t("previewDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ServiceCard
              id="draft-service-preview"
              image={draftPreviewImage || "/placeholder.svg?height=200&width=200"}
              name={`${previewUser?.firstName || ""} ${previewUser?.lastName || ""}`.trim() || t("yourNameFallback")}
              title={individualData.title || t("serviceTitleFallback")}
              experience={individualData.scopeOfService || t("serviceDescriptionFallback")}
              languages={Array.isArray(previewUser?.languages) ? previewUser.languages.join(", ") : t("defaultLanguages")}
              location={getServiceAreas(individualData.areaServed).join(", ") || t("serviceAreaFallback")}
              price={formatDraftPrice(individualData.price)}
              rating={0}
              reviews={0}
              distance="2.5 km"
              available
              verified={Boolean(previewUser?.isVerified)}
              onClick={() => undefined}
            />
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">{t("detailsIncludedOnSave")}</p>
              <p>{t("categoryLabel", { title: individualData.title || t("notSelected") })}</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col w-full items-center gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPreviewOpen(false)}
              disabled={submitting}
            >
              {t("editDetails")}
            </Button>
            <Button
              className="w-full bg-[#167021] hover:bg-brand-dark"
              onClick={saveServiceDraft}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveService")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="pb-6">
        <h1 className="text-lg font-bold">{isWorker ? t("workersServiceHeading") : t("yourServicesHeading")}</h1>
        {loadingServices ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-gray-500">{t("noServicesFound")}</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4">
            {services.map((service) => (
              <div key={service.id} className="relative">
                <ServiceCard
                  id={service.id}
                  image={imagePreviews[service.id] || "/placeholder.svg?height=200&width=200"}
                  name={
                    service.provider
                      ? `${service?.provider?.firstName} ${service.provider?.lastName}`
                      : t("notAvailable")
                  }
                  title={getCategoryName(service.category)}
                  experience={service.description || service.scopeOfService || t("noExperienceProvided")}
                  languages={t("defaultLanguages")}
                  location={service.areaServed || service.serviceAreas?.join(", ") || t("noLocationProvided")}
                  price={formatServicePrice(service)}
                  rating={service?.reviews?.averageRating || 0}
                  reviews={service?.reviews?.totalReviews || 0}
                  distance="2.5 km"
                  available={service.isActive}
                  verified={service?.provider?.isVerified || isEmployer(service?.provider?.roles)}
                  onClick={() => handleEditClick(service)}
                />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(service)}
                    className="flex-1 text-brand hover:text-[#20471e] border-[#20471e] border hover:bg-red-50 z-10"
                  >
                    <Pencil className="w-4 h-4" />
                    {t("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteModal(service.id)}
                    className="flex-1 border-red-600 border text-red-600 hover:text-red-800 hover:bg-red-50 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="w-[90%] top-1/3 translate-y-1/3">
          <DialogHeader className="text-start">
            <DialogTitle>{t("confirmDeletion")}</DialogTitle>
            <DialogDescription>
              {t("confirmDeleteMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col w-full items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setServiceToDelete(null)
              }}
               className="w-full"
            >
              {t("cancel")}
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleDeleteService} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-[380px] max-h-[80vh] overflow-y-auto top-10">
          <DialogHeader>
            <DialogTitle>{t("editService")}</DialogTitle>
          </DialogHeader>
          {editingServiceId && updateData[editingServiceId] && (
            <ServiceForm
              initialData={updateData[editingServiceId]}
              isWorker={isWorker}
              onSubmit={(e) => handleUpdateService(e, editingServiceId)}
              submitting={submitting}
              setData={(newData) =>
                setUpdateData((prev) => ({
                  ...prev,
                  [editingServiceId]: typeof newData === "function" ? newData(prev[editingServiceId]) : newData,
                }))
              }
              onCancel={() => {
                setEditModalOpen(false)
                setEditingServiceId(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default IndividualForm
