"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Home, Plus, Loader2, Trash2, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import BackButtonHeader from "@/components/header/back-button-header";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import {
  AppButton,
  Card,
  EmptyState,
  FormField,
  PageShell,
  appContentClass,
  appInputClass,
} from "@/components/ui/app-primitives";
import { getApiErrorMessage } from "@/lib/error-handler";
import { cn } from "@/lib/utils";

// Interface for address data
interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Interface for form data
interface FormData {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const AddressBook = () => {
  const [formData, setFormData] = useState<FormData>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Fetch addresses from /users/profile
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/users/profile");
        const addressesData = response.data.data?.addresses || response.data.addresses || [];
        setAddresses(addressesData);
      } catch (err: unknown) {
        console.error("Error fetching addresses:", err);
        toast.error("Failed to fetch addresses");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Handle select changes
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Handle checkbox change
  const handleCheckboxChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, isDefault: checked }));
  }, []);

  // Validate form data
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.street.trim()) {
      newErrors.street = "Street is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{5,}$/.test(formData.postalCode)) {
      newErrors.postalCode = "Invalid postal code";
    }
    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission (create/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        isDefault: formData.isDefault,
      };

      if (editingAddressId) {
        // Update existing address
        const response = await api.patch(`/address-book/${editingAddressId}`, payload);
        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === editingAddressId ? { ...addr, ...response.data.data } : addr
          )
        );
        toast.success("Address updated successfully");
      } else {
        // Create new address
        const response = await api.post("/address-book", payload);
        setAddresses((prev) => [...prev, response.data.data]);
        toast.success("Address added successfully");
      }

      // Reset form and hide it
      setFormData({
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        isDefault: false,
      });
      setIsFormVisible(false);
      setEditingAddressId(null);
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err, `Failed to ${editingAddressId ? "update" : "add"} address`);
      console.error(`Error ${editingAddressId ? "updating" : "adding"} address:`, err);
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle address deletion
  const handleDelete = async (addressId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/address-book/${addressId}`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      toast.success("Address deleted successfully");
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err, "Failed to delete address");
      console.error("Error deleting address:", err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle address editing
  const handleEdit = (address: Address) => {
    setFormData({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address.id);
    setIsFormVisible(true);
    setErrors({});
  };

  // Toggle form visibility
  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
    setFormData({
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      isDefault: false,
    });
    setEditingAddressId(null);
    setErrors({});
  };

  return (
    <PageShell className="gap-5">
      <BackButtonHeader text="Address Book" backHref="/more" />

      {/* Add Address Button */}
      <button
        type="button"
        className="flex items-center gap-2 px-1 text-[#167021]"
        onClick={toggleFormVisibility}
      >
        <Plus className="h-4 w-4" />
        <span className="text-base font-semibold leading-5">
          {isFormVisible ? "Cancel" : "Add another address"}
        </span>
      </button>

      {/* Form */}
      {isFormVisible && (
        <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Street */}
          <FormField label="Street" error={errors.street}>
            <Input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              className={cn(appInputClass, errors.street && "border-red-500")}
              placeholder="Enter street address"
            />
          </FormField>

          {/* City */}
          <FormField label="City" error={errors.city}>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={cn(appInputClass, errors.city && "border-red-500")}
              placeholder="Enter city"
            />
          </FormField>

          {/* State */}
          <FormField label="State" error={errors.state}>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={cn(appInputClass, errors.state && "border-red-500")}
              placeholder="Enter state"
            />
          </FormField>

          {/* Postal Code */}
          <FormField label="Postal Code" error={errors.postalCode}>
            <Input
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              className={cn(appInputClass, errors.postalCode && "border-red-500")}
              placeholder="Enter postal code"
            />
          </FormField>

          {/* Country */}
          <FormField label="Country" error={errors.country}>
            <Select
              value={formData.country}
              onValueChange={(value) => handleSelectChange("country", value)}
            >
              <SelectTrigger
                id="country"
                className={cn(appInputClass, "relative", errors.country && "border-red-500")}
              >
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rwanda">Rwanda</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="India">India</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* Default Address Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={handleCheckboxChange}
            />
            <label
              htmlFor="isDefault"
              className="text-sm font-semibold text-[#161616]"
            >
              Set as default address
            </label>
          </div>

          <div className="flex flex-col gap-2">
            {/* Submit Button */}
            <AppButton
              size="lg"
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingAddressId ? "Updating..." : "Adding..."}
                </>
              ) : (
                editingAddressId ? "Update Address" : "Add Address"
              )}
            </AppButton>
            {/* Cancel Button */}
            <AppButton
              size="lg"
              type="button"
              appVariant="secondary"
              className="w-full"
              onClick={toggleFormVisibility}
            >
              Cancel
            </AppButton>
          </div>
        </form>
        </Card>
      )}

      {/* Display Addresses */}
      <div className={appContentClass}>
        {
          isLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-center" />
            </div>
          ) : (
            addresses.length === 0 ? (
              <EmptyState
                icon={Home}
                title="No addresses found"
                description="Add an address above so bookings can use your saved locations."
              />
            ) : (
              addresses.map((address, index) => (
                <Card key={address.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h1 className="text-[#161616] text-base leading-5 font-semibold">
                      {address.isDefault ? "Default Address" : `Address ${index + 1}`}
                    </h1>
                    <div className="flex">
                      <button
                        type="button"
                        className="rounded-full p-2 hover:bg-[#F1FCEF]"
                        onClick={() => handleEdit(address)}
                        disabled={isLoading}
                        aria-label="Edit address"
                      >
                        <Edit3 className="h-4 w-4 text-[#167021]" />
                      </button>
                      <button
                        type="button"
                        className="rounded-full p-2 hover:bg-red-50"
                        onClick={() => handleDelete(address.id)}
                        disabled={isLoading}
                        aria-label="Delete address"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[#757575] font-medium text-sm">
                    {`${address.street}, ${address.state}, ${address.postalCode}, ${address.city}, ${address.country}`}
                  </p>
                </Card>
              ))
            )
          )
        }

      </div>
    </PageShell>
  );
};

export default AddressBook;
