"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import BackButtonHeader from "@/components/header/back-button-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Calendar, MapPin, Ticket } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Provider, Service } from "@/types";
import { formatPrice } from "@/lib/utils";
import { isEmployer } from "@/lib/roles";
import {
    AppButton,
    AppSectionHeader,
    Card,
    PageShell,
    appInputClass,
} from "@/components/ui/app-primitives";

// Define the address interface
interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

const BookingSummary = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [additionalServices, setAdditionalServices] = useState<Service[]>([]);
    const [selectedAdditionalServiceIds] = useState<string[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [isLoadingService, setIsLoadingService] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch service details and set provider
    useEffect(() => {
        const serviceId = params.id as string;
        const date = searchParams.get("date");
        const time = searchParams.get("time");

        if (!serviceId) {
            toast.error("Invalid service ID");
            setIsLoadingService(false);
            return;
        }

        if (!date || !time) {
            toast.error("Missing date or time");
            setIsLoadingService(false);
            return;
        }

        setSelectedDate(decodeURIComponent(date));
        setSelectedTime(decodeURIComponent(time));

        const fetchService = async () => {
            try {
                setIsLoadingService(true);
                const response = await api.get(`/services/${serviceId}`);
                const service: Service = response.data.data;

                const mappedProvider: Provider = {
                    id: service.id,
                    image: service.serviceImage || "/default-service.svg",
                    name: service.provider
                        ? `${service.provider.firstName} ${service.provider.lastName}`
                        : service.company?.name || "Company",
                    handle: service.provider
                        ? `${service.provider.firstName.toLowerCase()}${service.provider.lastName.toLowerCase()}`
                        : undefined,
                    title: service.title,
                    experience: service.description || "No experience provided",
                    languages: Array.isArray(service?.worker?.languages) ? service.worker.languages.join(", ") : "",
                    location: Array.isArray(service.serviceAreas) ? service.serviceAreas.join(", ") : service.serviceAreas || "",
                    price: formatPrice(service.priceMin, service.priceMax, service.priceType),
                    rating: 4.8,
                    reviews: 8289,
                    distance: "2 miles",
                    available: true,
                    verified: true,
                    type: isEmployer(service.provider?.roles) ? "Agency" : "Professional",
                };

                setProvider(mappedProvider);
            } catch (error) {
                console.error("Failed to fetch service data:", error);
                toast.error("Failed to load service details");
            } finally {
                setIsLoadingService(false);
            }
        };

        fetchService();
    }, [searchParams, params]);

    // Fetch addresses from /users/profile
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                setIsLoadingAddresses(true);
                const response = await api.get("/users/profile");
                const addressesData = response.data.data?.addresses || response.data.addresses || [];
                setAddresses(addressesData);
                const defaultAddress = addressesData.find((addr: Address) => addr.isDefault);
                setSelectedAddressId(defaultAddress ? defaultAddress.id : addressesData[0]?.id || null);
            } catch (err) {
                console.error("Error fetching addresses:", err);
                toast.error("Failed to fetch addresses");
            } finally {
                setIsLoadingAddresses(false);
            }
        };
        fetchAddresses();
    }, []);

    // Fetch additional services
    useEffect(() => {
        const fetchAdditionalServices = async () => {
            try {
                const category = "all"; // Adjust category as needed
                const response = await api.get(`/services?category=${encodeURIComponent(category.toLowerCase())}`);
                const services = response.data.data || [];
                setAdditionalServices(services.filter((s: Service) => s.id !== params.id)); // Exclude the main service
            } catch (err) {
                console.error("Error fetching additional services:", err);
                toast.error("Failed to fetch additional services");
            }
        };
        fetchAdditionalServices();
    }, [params.id]);

    // Handle quantity changes
    const handleQuantityChange = (delta: number) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    // Handle address selection
    const handleAddressChange = (value: string) => {
        setSelectedAddressId(value);
    };

    // Handle adding additional service
    // const handleAddService = (serviceId: string) => {
    //     setSelectedAdditionalServiceIds((prev) =>
    //         prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    //     );
    // };

    // Convert selectedDate and selectedTime to ISO datetime

    // Handle proceed to checkout
   const handleProceedToCheckout = async () => {
    if (!selectedAddressId) {
        toast.error("Please select a service address");
        return;
    }
    if (!provider || !selectedDate || !selectedTime) {
        toast.error("Booking details are incomplete");
        return;
    }

    setIsSubmitting(true);
    try {
        // Parse the selected date and time
        const [year, month, day] = selectedDate.split('-');
        let [hours, minutes] = selectedTime.includes(':') 
            ? selectedTime.split(':') 
            : ['00', '00'];

        // Handle AM/PM if present
        if (selectedTime.toLowerCase().includes('am') || selectedTime.toLowerCase().includes('pm')) {
            const period = selectedTime.toLowerCase().includes('pm') ? 'pm' : 'am';
            [hours, minutes] = selectedTime.replace(/[^0-9:]/g, '').split(':');
            
            let hourNum = parseInt(hours, 10);
            if (period === 'pm' && hourNum < 12) hourNum += 12;
            if (period === 'am' && hourNum === 12) hourNum = 0;
            
            hours = hourNum.toString().padStart(2, '0');
        }

        // Create ISO string
        const isoString = `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`;
        const dateObj = new Date(isoString);

        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date/time combination');
        }

        const scheduledFor = dateObj.toISOString();

        const payload = {
            serviceId: provider.id.toString(),
            addressId: selectedAddressId,
            scheduledFor,
        };

        const response = await api.post("/bookings", payload);
        if (response.status === 201) {
            const booking = response.data.data || response.data;
            toast.success("Booking request sent successfully");
            router.push(`/conversations/inbox/${booking.id}`);
        }
    } catch (err) {
        console.error("Error creating booking:", err);
        const errorMessage = err instanceof Error 
            ? err.message 
            : "Failed to create booking";
        toast.error(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
};

    if (isLoadingService || !provider || !selectedDate || !selectedTime) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
        );
    }

    // Calculate pricing
    const itemTotal = Number(provider.price) * quantity +
        selectedAdditionalServiceIds.reduce((total, id) => {
            const service = additionalServices.find((s) => s.id === id);
            return total + (service ? Number(service.priceMin) : 0);
        }, 0);
    const discount = 0;
    const deliveryFee = 0;
    const grandTotal = itemTotal - discount + deliveryFee;

    return (
        <PageShell className="gap-4 touch-pan-y">
                <BackButtonHeader text="Booking Summary" backHref={`/book/${provider.type}/${provider.id}`} />

                {/* Main Provider */}
                <Card className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
                            <AvatarImage src={provider.image} className="object-cover" />
                            <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h2 className="text-base sm:text-lg font-semibold text-ink">{provider.name}</h2>
                            <p className="text-sm font-bold text-ink">{provider.title}</p>
                        </div>
                    </div>
                    <p className="text-ink-muted text-sm font-semibold">
                        <strong className="font-bold text-ink text-base">Description</strong>
                        <br />
                        {provider.experience}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-brand font-bold text-sm sm:text-base">{provider.price} RWF/day</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                className="w-8 h-8 border-[1.5px] border-brand text-brand rounded-none p-0 touch-manipulation"
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                            >
                                <ArrowDown className="w-4 h-4" />
                            </Button>
                            <span className="text-brand font-bold text-sm w-8 text-center">{quantity}</span>
                            <Button
                                variant="outline"
                                className="w-8 h-8 border-[1.5px] border-brand text-brand rounded-none p-0 touch-manipulation"
                                onClick={() => handleQuantityChange(1)}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Frequently Added Together */}
                {/* <h3 className="font-medium text-ink text-base">Frequently Added Together</h3>
                <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
                    {isLoadingAdditionalServices ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-brand" />
                        </div>
                    ) : additionalServices.length === 0 ? (
                        <p className="text-ink-muted text-sm font-medium">No additional services available.</p>
                    ) : (
                        additionalServices.map((service) => (
                            <div key={service.id} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <h2 className="text-base sm:text-lg font-semibold text-ink">
                                            {`${service.provider.firstName} ${service.provider.lastName}`}
                                        </h2>
                                        <p className="text-sm font-bold text-ink">{service.title}</p>
                                        <p className="text-sm text-ink-muted font-medium">
                                            {service.description || "No description provided"}
                                        </p>
                                        <p className="text-brand font-bold text-sm">{service.price} RWF/day</p>
                                    </div>
                                </div>
                                <div className="w-full flex justify-end">
                                    <Button
                                        className="rounded-full font-bold bg-brand text-white hover:bg-brand/90 text-sm py-2 px-3 touch-manipulation"
                                        onClick={() => handleAddService(service.id)}
                                    >
                                        {selectedAdditionalServiceIds.includes(service.id) ? "Remove" : "Add Service"}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div> */}

                {/* Booking Details */}
                <Card className="space-y-3">
                    <AppSectionHeader title="Booking Details" />
                    {/* Address Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-ink" />
                            <span className="text-brand font-medium text-sm">Service Address</span>
                        </div>
                        {isLoadingAddresses ? (
                            <div className="bg-surface flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-brand" />
                            </div>
                        ) : addresses.length === 0 ? (
                            <p className="text-ink-muted text-sm font-medium">
                                No addresses found.{" "}
                                <Link href="/more/addresses" className="text-brand underline">
                                    Add an address
                                </Link>
                            </p>
                        ) : (
                            <Select value={selectedAddressId || undefined} onValueChange={handleAddressChange}>
                                <SelectTrigger className={`${appInputClass} w-full touch-manipulation`}>
                                    <SelectValue placeholder="Select an address" />
                                </SelectTrigger>
                                <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
                                    {addresses.map((address) => (
                                        <SelectItem key={address.id} value={address.id}>
                                            {`${address.street}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}${address.isDefault ? " (Default)" : ""}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center gap-2 rounded-lg bg-white">
                        <Calendar className="w-4 h-4 stroke-black" />
                        <span className="text-brand font-medium text-sm">
                            {selectedDate} at {selectedTime}
                        </span>
                    </div>

                    {/* Coupon */}
                    <div className="flex items-center gap-2 rounded-lg bg-white">
                        <Ticket className="w-4 h-4 stroke-black" />
                        <span className="text-brand font-medium text-sm">Apply Coupons</span>
                    </div>
                </Card>

                {/* Pricing Breakdown */}
                <Card className="space-y-3">
                    <AppSectionHeader title="Pricing" />
                    <div className="flex justify-between text-ink-muted font-medium text-sm">
                        <span>Item Totals</span>
                        <span>{itemTotal} RWF</span>
                    </div>
                    <div className="flex justify-between text-ink-muted font-medium text-sm">
                        <span>Discounts</span>
                        <span>{discount} RWF</span>
                    </div>
                    <div className="flex justify-between text-ink-muted font-medium text-sm">
                        <span>Delivery Fee</span>
                        <span>{deliveryFee} RWF</span>
                    </div>
                    <div className="flex justify-between text-ink font-bold text-sm">
                        <span>Grand Total</span>
                        <span>{grandTotal} RWF</span>
                    </div>
                </Card>
                <div className="w-full flex items-center justify-center">
                    <AppButton
                        className="w-full touch-manipulation"
                        onClick={handleProceedToCheckout}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Proceed To Checkout"
                        )}
                    </AppButton>
                </div>
        </PageShell>
    );
};

export default BookingSummary;
