"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, SquarePlus } from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfileImageUploader from "@/components/profile/profile-img-uloader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { updateUser } from "@/store/slices/auth-slice";
import { toast } from "react-hot-toast";
import IndividualForm from "@/components/get-hired/individual-form";
import { Label } from "@/components/ui/label";
import AgencyWorkerForm from "@/components/get-hired/agency-worker-form";
import Link from "next/link";
import EditProfile from "../edit/page";

interface CommonProfile {
    name: string;
    email: string;
    lastName: string;
    dob: string;
    phone: string;
    country: string;
    servicesOffered: string[];
    weekdaysHours: string;
    weekendsHours: string;
    areasServiced: string[];
}


interface Professional {
    name: string;
    experience: string;
    languages: string;
    services: string;
    location: string;
    rating: string;
    profileImage?: string;
}

interface AgencyProfile extends CommonProfile {
    certificate: File | string | null;
    professionals: Professional[];
    logoImage?: string;
}

const GetHired: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { updateUserProfile } = useAuth();
    const [showWorkerForm, setShowWorkerForm] = useState(false)

    // Determine if user is coming for the first time
    const [selectedUserType, setSelectedUserType] = useState<"Individual" | "Agency">(user?.userType as "Individual" | "Agency" || "Individual");


    const [agencyData, setAgencyData] = useState<AgencyProfile>({
        name: "HouseHelp",
        email: "househelp@gmail.com",
        lastName: "Optional",
        dob: "12/27/1995",
        phone: "+250 467 379 999",
        country: "Rwanda",
        servicesOffered: ["Plumbing", "Carpentry", "Roofing"],
        weekdaysHours: "9:00 AM - 5:00 PM",
        weekendsHours: "9:00 AM - 1:00 PM",
        areasServiced: ["18. 30. 40. Condo, Townhouse, Multi-family"],
        certificate: null,
        professionals: [
            {
                name: "Abakiza Sitter",
                experience: "5 Years of Experience",
                languages: "English, Kinyarwanda, Kigali",
                services: "Baby Sitter",
                location: "Nyamirambo",
                rating: "4.8 - 5,000 reviews/day",
            },
            {
                name: "Mutanguha Electrician",
                experience: "5 Years of Experience",
                languages: "English, Kinyarwanda",
                services: "Electrician",
                location: "Kinyarwanda",
                rating: "4.5 - 3,000 reviews/day",
            },
        ],
    });

    const handleUserTypeChange = async (value: "Individual" | "Agency") => {
        setSelectedUserType(value);

        try {
            // Update the user profile on the server
            const success = await updateUserProfile({
                userType: value,
            }, user);

            if (success) {
                // Update Redux state
                dispatch(updateUser({ userType: value }));
            }
        } catch (error) {
            const message = (error as Error).message || "Failed to update user type";
            toast.error(message);
            // Revert the local state if the API call fails
            setSelectedUserType(user?.userType as "Individual" | "Agency" || "Individual");
        }
    };


    // Handle input changes for agency profile
    const handleAgencyChange = (field: keyof AgencyProfile, value: string | File | null) => {
        if (field === "servicesOffered" || field === "areasServiced") {
            setAgencyData((prev) => ({
                ...prev,
                [field]: value ? (value as string).split(",").map((item) => item.trim()) : [],
            }));
        } else if (field === "certificate" && value instanceof File) {
            setAgencyData((prev) => ({
                ...prev,
                certificate: value, // Store the File object
            }));
        } else {
            setAgencyData((prev) => ({
                ...prev,
                [field]: value as string || "", // Ensure value is never undefined
            }));
        }
    };

    // Handle file input change for certificate
    const handleCertificateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        handleAgencyChange("certificate", file);
    };


    const handleAddWorker = () => {
        setShowWorkerForm((p) => !p)
    }

    return (
        <div className="">
            <div className="p-6 flex items-center justify-between">
                <BackButtonHeader text="Get Hired" backHref="/profile" />
                {
                    user?.userType === "Agency" && !showWorkerForm ? (
                        <SquarePlus onClick={handleAddWorker} className="text-[#145B10] w-6 h-6 cursor-pointer" />
                    ) : (
                        <Link href={"/profile/edit"} type="button" className="p-1.5 rounded-sm bg-transparent hover:bg-transparent text-[#145B10] border text-sm font-semibold border-[#145B10]">
                            Edit Personal Info
                        </Link>
                    )
                }
            </div>
            {
                showWorkerForm ? <div className="px-6 pb-6">
                    <AgencyWorkerForm />
                </div> : <div className="pb-10">
                    <ProfileImageUploader />
                    <div className="px-6 pt-6">
                        <div className="space-y-0.5">
                            <Label className="font-semibold text-secondary-foreground/50 text-sm">User Type</Label>
                            <Select
                                value={user?.userType || selectedUserType}
                                disabled
                                onValueChange={handleUserTypeChange}
                            >
                                <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]">
                                    <SelectValue placeholder="Select user type" />
                                    <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Individual">Individual</SelectItem>
                                    <SelectItem value="Agency">Agency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {user?.userType === "Individual" ? (
                        // Individual Profile Form
                        <div className="">
                            <EditProfile idEditable={false} />
                            <div className="px-6 space-y-6">
                           
                                
                                <div className="text-[#1B2431] text-lg font-medium">
                                    Services Offered
                                </div>
                                <IndividualForm isWorker={false} />
                            </div>
                        </div>
                    ) : (
                        // Agency Profile Form
                        <div className="p-6">
                            <div className="space-y-6">
                                <Input
                                    id="agencyName"
                                    defaultValue={user?.firstName || ""}
                                    onChange={(e) => handleAgencyChange("name", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                                <Input
                                    id="lastName"
                                    defaultValue={user?.lastName || ""}
                                    onChange={(e) => handleAgencyChange("lastName", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                                <Input
                                    id="email"
                                    defaultValue={user?.email || ""}
                                    onChange={(e) => handleAgencyChange("email", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                                <Input
                                    id="dob"
                                    type="date"
                                    defaultValue={user?.dateOfBirth || ""}
                                    onChange={(e) => handleAgencyChange("dob", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                                <Input
                                    id="phone"
                                    defaultValue={user?.phoneNumber || ""}
                                    onChange={(e) => handleAgencyChange("phone", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                                <Input
                                    id="country"
                                    defaultValue={agencyData.country || ""}
                                    disabled
                                    onChange={(e) => handleAgencyChange("country", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                                <Input
                                    id="certificate"
                                    type="file"
                                    onChange={handleCertificateChange}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                    accept="application/pdf"
                                />
                                {agencyData.certificate instanceof File && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Selected file: {agencyData.certificate.name}
                                    </p>
                                )}
                                {typeof agencyData.certificate === "string" && agencyData.certificate && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Current file: {agencyData.certificate}
                                    </p>
                                )}
                            </div>
                            <div className="py-5">
                                <Label className="text-base pb-5 font-semibold">Add Service</Label>
                                <IndividualForm isWorker={true} />
                            </div>
                        </div>
                    )}
                </div>
            }

        </div >
    );
};

export default GetHired;