"use client"

import React, { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"
import api from "@/lib/axios"

interface Category {
  id: string
  name: string
  icon?: string
}

interface ServiceCategorySelectorProps {
  onContinue: (categories: string[]) => void
  onBack: () => void
  isLoading?: boolean
}

export const ServiceCategorySelector = ({
  onContinue,
  onBack,
  isLoading = false,
}: ServiceCategorySelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await api.get("/categories", {
        withCredentials: true,
      })
      // Handle both direct array and wrapped response
      const categoryData = response.data.data || response.data || []
      setCategories(Array.isArray(categoryData) ? categoryData : [])
    } catch (error) {
      console.error("Error loading categories:", error)
      // Fallback to common service categories
      setCategories([
        { id: "1", name: "Cleaning" },
        { id: "2", name: "Cooking" },
        { id: "3", name: "Childcare" },
        { id: "4", name: "Elder Care" },
        { id: "5", name: "Laundry" },
        { id: "6", name: "Gardening" },
        { id: "7", name: "Ironing" },
        { id: "8", name: "Pet Care" },
      ])
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }
    setSelectedCategories(newSelected)
  }

  const handleContinue = () => {
    if (selectedCategories.size === 0) {
      toast.error("Please select at least one service category")
      return
    }
    onContinue(Array.from(selectedCategories))
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
          What services do you offer?
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Select the categories that match your skills
        </p>
      </div>

      {isLoadingCategories ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-[#145B10] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#145B10] transition-colors has-[input:checked]:border-[#145B10] has-[input:checked]:bg-[#F1FCEF]"
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="w-5 h-5 rounded accent-[#145B10] cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-600 text-center mb-8">
        {selectedCategories.size > 0 && (
          <p>
            {selectedCategories.size} categor{selectedCategories.size === 1 ? "y" : "ies"} selected
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedCategories.size === 0 || isLoading}
          className="flex-1 px-6 py-3 bg-[#145B10] text-white font-semibold rounded-lg hover:bg-[#0f4a0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
