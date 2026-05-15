"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Loader2, CalendarIcon, Mail, User, Phone, Languages, FileText, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import BackButtonHeader from "@/components/header/back-button-header";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { updateUser } from "@/store/slices/auth-slice";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { colors } from "@/constant/colors";
import APP_CONFIG from "@/constant/app.config";
import ProfileImageUploader from "@/components/profile/profile-img-uloader";

// Interface for form data to ensure type safety
interface FormData {
    firstName: string;
    lastName: string;
    username: string;
    dateOfBirth: string;
    email: string;
    country: string;
    phone: string;
    gender: string;
    languages: string[];
    street: string;
    city: string;
    state: string;
    postalCode: string;
    certificate: File | null;
}

const EditProfile = ({ idEditable = true }: { idEditable?: boolean }) => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    // Strip 250 country code prefix for clean display in input
    const stripCountryCode = (phone: string) => phone.replace(/^250/, "");

    const [formData, setFormData] = useState<FormData>({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        username: user?.username || "",
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
        email: user?.email || "",
        country: user?.country || "Rwanda",
        phone: stripCountryCode(user?.phoneNumber || ""), // Store without 250 prefix (added at save time)
        gender: user?.gender || "",
        languages: user?.languages || [],
        street: "",
        city: "",
        state: "",
        postalCode: "",
        certificate: null,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const response = await api.get(`/users/profile`);
                    const userData = response.data?.data || {};
                    setFormData((prev) => ({
                        ...prev,
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        username: userData.username || "",
                        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split("T")[0] : "",
                        email: userData.email || "",
                        country: userData.country || "Rwanda",
                        phone: stripCountryCode(userData.phoneNumber || ""), // Strip 250 prefix for display
                        gender: userData.gender || "",
                        languages: userData.languages || [],
                        street: userData.address?.street || "",
                        city: userData.address?.city || "",
                        state: userData.address?.state || "",
                        postalCode: userData.address?.postalCode || "",
                        certificate: null,
                    }));
                } catch {
                    toast.error("Failed to load user data");
                }
            }
        };
        fetchUserData();
    }, [user]);

    React.useEffect(() => {
        if (!user) {
            toast.error("User not authenticated");
            router.push("/onboarding");
        }
    }, [user, router]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    }, []);

    const handleSelectChange = useCallback((name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    }, []);

    const handleLanguageChange = useCallback((language: string) => {
        setFormData((prev) => {
            const languages = prev.languages.includes(language)
                ? prev.languages.filter((lang) => lang !== language)
                : [...prev.languages, language];
            return { ...prev, languages };
        });
        setErrors((prev) => ({ ...prev, languages: "" }));
    }, []);

    const toggleLanguageDropdown = useCallback(() => {
        setIsLanguageDropdownOpen((prev) => !prev);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLanguageDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCertificateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;

        const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];

        if (file && !allowedTypes.includes(file.type)) {
            setErrors((prev) => ({ ...prev, certificate: "Please upload a PDF or image file (PNG, JPG, JPEG, WEBP)" }));
            return;
        }

        setFormData((prev) => ({ ...prev, certificate: file }));
        setErrors((prev) => ({ ...prev, certificate: "" }));
    }, []);


    const validateForm = useCallback(() => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "Date of birth is required";
        } else if (isNaN(new Date(formData.dateOfBirth).getTime())) {
            newErrors.dateOfBirth = "Invalid date of birth";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        }
        if (!formData.gender) {
            newErrors.gender = "Gender is required";
        }
        if (!formData.country) {
            newErrors.country = "Country is required";
        }
        if (formData.languages.length === 0) {
            newErrors.languages = "At least one language is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the form errors");
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const gender = formData.gender?.toUpperCase();
            if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
                throw new Error("Invalid gender value");
            }

            const dateOfBirth = new Date(formData.dateOfBirth);
            if (isNaN(dateOfBirth.getTime())) {
                throw new Error("Invalid date of birth");
            }

            // Phone number is read-only (locked after signup), use the existing user phone number.
            // This avoids validation failures when stored data is malformed (e.g. legacy double-prefix data).
            // Source of truth: the user's existing phone number from auth state.
            let phoneNumber = String(user?.phoneNumber || "").trim().replace(/\D/g, "");

            // Ensure proper format: should be 250 + 9 digits
            if (phoneNumber && !phoneNumber.startsWith("250")) {
                // Add 250 prefix if missing
                phoneNumber = "250" + phoneNumber;
            }

            // Normalize: if there's any prefix issue (e.g. 250250...), keep only the last 12 chars
            if (phoneNumber.length > 12) {
                phoneNumber = "250" + phoneNumber.slice(-9);
            }

            // Only validate if we have a phone number (it should always exist after signup)
            const validPhoneRegex = /^250\d{9}$/;
            if (phoneNumber && !validPhoneRegex.test(phoneNumber)) {
                // If phone is malformed in DB, log warning but don't block save of other fields
                console.warn("Phone number format issue:", phoneNumber);
            }

            // Generate username if not provided
            let username = formData.username;
            if (!username && formData.firstName) {
                const firstPart = formData.firstName.toLowerCase().slice(0, 5);
                const lastPart = formData.lastName?.toLowerCase().slice(0, 4) || "";
                username = firstPart + lastPart;

                // Check if available, add number if taken
                try {
                  let availCheck = await api.get(`/users/username/${username}/check`);
                  if (!availCheck.data.available) {
                    let counter = 1;
                    while (!availCheck.data.available && counter < 100) {
                      const newUsername = username + counter;
                      availCheck = await api.get(`/users/username/${newUsername}/check`);
                      if (availCheck.data.available) {
                        username = newUsername;
                        break;
                      }
                      counter++;
                    }
                  }
                } catch {
                  // If check fails, just use the generated username
                }
            }

            // Validate username if provided
            if (username) {
                const usernameRegex = /^[a-z0-9_-]{3,30}$/;
                if (!usernameRegex.test(username)) {
                    throw new Error("Username must be 3-30 characters, lowercase letters, numbers, underscores, or hyphens only");
                }

                // Check username availability
                try {
                    const checkResponse = await api.get(`/users/username/${username}/check`);
                    if (!checkResponse.data.available && user?.username !== username) {
                        throw new Error("Username is already taken");
                    }
                } catch (checkErr: unknown) {
                    const usernameCheckError = checkErr as { response?: { status?: number; data?: { message?: string } }; message?: string };
                    if (usernameCheckError.response?.status === 400) {
                        throw new Error(usernameCheckError.response?.data?.message || "Invalid username format");
                    }
                    if (usernameCheckError.message?.includes("already taken")) {
                        throw checkErr;
                    }
                }
            }

            const payload = {
                phoneNumber,
                firstName: String(formData.firstName),
                lastName: String(formData.lastName),
                username: username ? String(username) : undefined,
                email: String(formData.email),
                gender,
                dateOfBirth: dateOfBirth.toISOString(),
                languages: formData.languages.map(String),
                userType: user?.userType === "Agency" ? "AGENCY" : "INDIVIDUAL",
                // certificate: formData.certificate ?? null,
            };

            // Use PATCH for profile updates (username can be updated via PATCH)
            const profileResponse = await api.patch("/users/profile", payload);

            const userData = profileResponse?.data?.data;

            const updatedUser = {
                id: userData.id,
                username: userData.username,
                phoneNumber: userData.phoneNumber,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                userType: userData.userType,
                isProfileComplete: userData.isProfileComplete ?? user?.isProfileComplete,
                isMobileVerified: userData.isMobileVerified ?? user?.isMobileVerified,
                isEmailVerified: userData.isEmailVerified ?? user?.isEmailVerified,
                gender: userData.gender,
                dateOfBirth: userData.dateOfBirth,
                languages: userData.languages,
                country: userData.country,
            };

            dispatch(updateUser(updatedUser));
            toast.success("Profile updated successfully");
            router.push("/more");
        } catch (err: unknown) {
            const errorMessage =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Failed to update profile";
            setErrors({ form: errorMessage });
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    const availableLanguages = APP_CONFIG.profile.languages;
    const genderOptions = APP_CONFIG.profile.genders;

    return (
        <div className={`px-4 sm:px-6 ${idEditable ? "pt-4 pb-24" : "py-4"} min-h-screen overflow-y-auto touch-pan-y`} style={{ backgroundColor: colors.background }}>
            {idEditable && <BackButtonHeader text="Edit Profile" backHref="/more" className="pb-6" />}

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                {idEditable && (
                    <div className="rounded-lg bg-white p-4 shadow-sm" style={{ border: `1px solid ${colors.border}` }}>
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: colors.backgroundTertiary, color: colors.primary }}>
                                <User className="h-5 w-5" />
                            </span>
                            <div>
                                <h1 className="text-base font-bold leading-5" style={{ color: colors.text }}>Personal information</h1>
                                <p className="mt-1 text-xs leading-5" style={{ color: colors.textMuted }}>
                                    Keep your public profile accurate. Your phone number stays locked for account safety.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {idEditable && (
                    <div className="rounded-lg bg-white p-4 shadow-sm" style={{ border: `1px solid ${colors.border}` }}>
                        <ProfileImageUploader />
                    </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                    <User className="h-4 w-4" style={{ color: colors.primary }} />
                    <h2 className="text-sm font-bold" style={{ color: colors.text }}>Identity</h2>
                </div>
                {/* First Name */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">First Name</Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        disabled={!idEditable}
                        onChange={handleChange}
                        className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.firstName ? "border-red-500" : "border-none"} focus:ring-2 touch-manipulation`}
                        placeholder="Enter first name"
                        style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">Last Name</Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        disabled={!idEditable}
                        onChange={handleChange}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-2 touch-manipulation"
                        placeholder="Enter last name (Optional)"
                        style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                    />
                </div>

                {/* Username */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">
                        Username <span className="text-gray-400 text-xs">(for sharing your profile)</span>
                    </Label>
                    <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        disabled={!idEditable}
                        onChange={(e) => {
                            // Convert to lowercase and remove invalid characters
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                            setFormData((prev) => ({ ...prev, username: value }));
                            setErrors((prev) => ({ ...prev, username: "" }));
                        }}
                        className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.username ? "border-red-500" : "border-none"} focus:ring-2 touch-manipulation`}
                        placeholder="your-username"
                        maxLength={30}
                        style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                    />
                    {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
                    {formData.username && (
                        <p className="text-xs text-gray-500">
                            Your profile link: {typeof window !== "undefined" ? window.location.origin : ""}/provider/{formData.username}
                        </p>
                    )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">Date of Birth</Label>
                    <div className="relative">
                        <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            disabled={!idEditable}
                            onChange={handleChange}
                            className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-9 focus:outline-none border ${errors.dateOfBirth ? "border-red-500" : "border-none"} focus:ring-2 touch-manipulation`}
                            style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                        />
                        <CalendarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    {errors.dateOfBirth && <p className="text-red-500 text-xs">{errors.dateOfBirth}</p>}
                </div>

                <div className="flex items-center gap-2 pt-3">
                    <Mail className="h-4 w-4" style={{ color: colors.primary }} />
                    <h2 className="text-sm font-bold" style={{ color: colors.text }}>Contact</h2>
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">Email</Label>
                    <div className="relative">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            disabled={!idEditable}
                            onChange={handleChange}
                            className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-9 focus:outline-none border ${errors.email ? "border-red-500" : "border-none"} focus:ring-2 touch-manipulation`}
                            placeholder="Enter email"
                            style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                        />
                        <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>

                <div className="flex items-center gap-2 pt-3">
                    <MapPin className="h-4 w-4" style={{ color: colors.primary }} />
                    <h2 className="text-sm font-bold" style={{ color: colors.text }}>Location</h2>
                </div>

                {/* Country */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">Country</Label>
                    <Input
                        id="country"
                        name="country"
                        value="Rwanda"
                        disabled
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-2 text-gray-500 touch-manipulation"
                        style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                    />
                    {errors.country && <p className="text-red-500 text-xs">{errors.country}</p>}
                </div>

                {/* Phone Number - Read Only */}
                <div className={`space-y-1`}>
                    <Label className={`font-semibold text-xs text-secondary-foreground`}>Phone Number</Label>
                    <div className="flex items-center rounded-lg overflow-hidden w-full h-14 bg-gray-100" style={{ border: `1px solid ${colors.borderSecondary}` }}>
                        <div className="flex items-center gap-1.5 pl-2 pr-4 h-full bg-white" style={{ borderRight: `1px solid ${colors.borderSecondary}` }}>
                            <Image
                                height={14}
                                width={20}
                                src="https://flagcdn.com/w40/rw.png"
                                alt="Rwanda Flag"
                                className="w-5 h-3.5 object-cover rounded-sm"
                            />
                            <span className="text-[#212121] font-semibold text-xs">+250</span>
                        </div>
                        <input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            value={formData.phone}
                            placeholder="Phone Number"
                            readOnly
                            disabled
                            className="h-full w-full px-3 text-[#212121] font-semibold text-sm bg-gray-100 cursor-not-allowed border-none outline-none focus:outline-none focus:ring-0 focus:border-none active:outline-none active:ring-0 active:border-none shadow-none touch-manipulation"
                            maxLength={9}
                        />
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone className="h-3.5 w-3.5" />
                        Phone number cannot be changed
                    </p>
                </div>

                <div className="flex items-center gap-2 pt-3">
                    <Languages className="h-4 w-4" style={{ color: colors.primary }} />
                    <h2 className="text-sm font-bold" style={{ color: colors.text }}>Profile details</h2>
                </div>

                {/* Gender */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">Gender</Label>
                    <Select
                        value={formData.gender}
                        onValueChange={(value) => handleSelectChange("gender", value)}
                        disabled={!idEditable}
                    >
                        <SelectTrigger
                            id="gender"
                            className={`relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.gender ? "border-red-500" : "border-none"} focus:ring-2 touch-manipulation`}
                            style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                        >
                            <SelectValue placeholder="Select gender" />
                            <ChevronDown className="w-4 h-4 text-black fill-black absolute right-5 focus-within:rotate-180 transition ease-in duration-150" />
                        </SelectTrigger>
                        <SelectContent>
                            {genderOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
                </div>

                {/* Languages Spoken */}
                <div className="relative space-y-1" ref={dropdownRef}>
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">Languages Spoken</Label>
                    <div
                        onClick={toggleLanguageDropdown}
                        className={`${idEditable ? "" : "pointer-events-none opacity-50"} relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.languages ? "border-red-500" : "border-none"} focus:ring-2 cursor-pointer flex items-center justify-between touch-manipulation`}
                        style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            toggleLanguageDropdown();
                          }
                        }}
                    >
                        <span className="truncate">
                            {formData.languages.length > 0 ? formData.languages.join(", ") : "Select languages"}
                        </span>
                        <ChevronDown
                            className={`w-4 h-4 text-black fill-black transition-transform duration-150 ${isLanguageDropdownOpen ? "rotate-180" : ""}`}
                        />
                    </div>
                    {isLanguageDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {availableLanguages.map((language) => (
                                <div
                                    key={language}
                                    onClick={() => handleLanguageChange(language)}
                                    className="flex items-center px-3 py-1.5 cursor-pointer hover:bg-gray-100 touch-manipulation"
                                >
                                    <span className="flex-1 text-sm">{language}</span>
                                    {formData.languages.includes(language) && (
                                        <span className="text-green-500 ml-2 text-sm">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {errors.languages && <p className="text-red-500 text-xs">{errors.languages}</p>}
                </div>

                <div className="flex items-center gap-2 pt-3">
                    <FileText className="h-4 w-4" style={{ color: colors.primary }} />
                    <h2 className="text-sm font-bold" style={{ color: colors.text }}>Verification</h2>
                </div>

                {/* Certificate Upload */}
                <div className="space-y-1">
                    <Label className="font-semibold text-secondary-foreground/50 text-xs">National ID (PDF)</Label>
                    <Input
                        id="certificate"
                        type="file"
                        onChange={handleCertificateChange}
                        disabled={!idEditable}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-2 touch-manipulation"
                        accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                        style={{ "--tw-ring-color": colors.primary } as React.CSSProperties}
                    />
                    {formData.certificate && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                            Selected file: {formData.certificate.name}
                        </p>
                    )}
                    {errors.certificate && <p className="text-red-500 text-xs">{errors.certificate}</p>}
                </div>

                {/* Update Button */}
                {idEditable && (
                    <Button
                        size="lg"
                        type="submit"
                        className="sticky bottom-4 z-10 w-full text-white rounded-lg font-bold text-base py-2.5 px-4 h-14 transition-colors touch-manipulation shadow-lg"
                        style={{
                          backgroundColor: colors.primaryHover,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.primaryActive;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.primaryHover;
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update"
                        )}
                    </Button>
                )}
            </form>
        </div>
    );
};

export default EditProfile;
