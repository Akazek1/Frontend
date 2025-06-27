"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Loader2 } from "lucide-react"
import { MultiSelectLanguage } from "../multi-language-select"
import api from "@/lib/axios"
import toast from "react-hot-toast"

const AgencyWorkerForm = () => {
    const [agencyWorker, setAgencyWorker] = useState<AgencyWorker>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        dateOfBirth: "",
        languages: [],
        gender: "",
    })
    const [nationalIdFile, setNationalIdFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    // Define the AgencyWorker type for clarity
    interface AgencyWorker {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
        dateOfBirth: string;
        languages: string[];
        gender: string;
    }

    // Sample validateForm function with age validation
    const validateForm = (workerData: AgencyWorker, file: File | null): string | null => {
        if (!workerData.firstName.trim()) return "First name is required";
        if (!workerData.lastName.trim()) return "Last name is required";
        if (!workerData.phoneNumber.trim()) return "Phone number is required";
        if (!workerData.email.trim()) return "Email is required";
        if (!workerData.dateOfBirth) return "Date of birth is required";
        if (workerData.languages.length === 0) return "At least one language is required";

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(workerData.email.trim())) return "Invalid email format";

        // Phone number format validation (basic example, adjust as needed)
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(workerData.phoneNumber.trim())) return "Invalid phone number format";

        // Age validation (must be > 18)
        const dob = new Date(workerData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const dayDiff = today.getDate() - dob.getDate();

        // validate age
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        if (isNaN(dob.getTime()) || adjustedAge <= 18) {
            return "Worker must be older than 18 years";
        }

        // File validation (if required)
        if (!file) return "National ID file is required";

        return null;
    };

    const handleAddAgencyWorker = async (workerData: AgencyWorker, file: File | null) => {
        try {
            setLoading(true);

            // Validate form data
            const validationError = validateForm(workerData, file);
            if (validationError) {
                toast.error(validationError);
                return;
            }

            const formData = new FormData();

            // Add all required fields as strings
            formData.append("firstName", workerData.firstName.trim());
            formData.append("lastName", workerData.lastName.trim());
            formData.append("phoneNumber", workerData.phoneNumber.trim());
            formData.append("email", workerData.email.trim());

            // Add date in ISO format
            if (workerData.dateOfBirth) {
                formData.append("dateOfBirth", workerData.dateOfBirth);
            }

            // Add languages as a JSON string (single field)
            formData.append("languages", JSON.stringify(workerData.languages.map((lang) => lang.trim())));

            // Add gender if provided
            if (workerData.gender) {
                formData.append("gender", workerData.gender);
            }

            // Add file
            if (file) {
                formData.append("file", file);
            }

            const token = localStorage.getItem("token");
            const response = await api.post("/agency/workers", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            if (response.status === 201) {
                toast.success("Worker added successfully");
                // Reset form
                setAgencyWorker({
                    firstName: "",
                    lastName: "",
                    phoneNumber: "",
                    email: "",
                    dateOfBirth: "",
                    languages: [],
                    gender: "",
                });
                setNationalIdFile(null);

                // Reset file input
                const fileInput = document.getElementById("nationalId") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            }
        } catch (error: unknown) {
            const message =
                typeof error === "object" &&
                    error !== null &&
                    "response" in error &&
                    (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : "Failed to submit worker";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        await handleAddAgencyWorker(agencyWorker, nationalIdFile)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center justify-center mb-5">
            <Input
                id="firstName"
                value={agencyWorker.firstName}
                onChange={(e) => setAgencyWorker((prev) => ({ ...prev, firstName: e.target.value }))}
                className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                placeholder="Worker's First Name"
                required
            />
            <Input
                id="lastName"
                value={agencyWorker.lastName}
                onChange={(e) => setAgencyWorker((prev) => ({ ...prev, lastName: e.target.value }))}
                className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                placeholder="Worker's Last Name"
                required
            />
            <Input
                id="email"
                type="email"
                value={agencyWorker.email}
                onChange={(e) => setAgencyWorker((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                placeholder="Worker's Email"
                required
            />
            <Input
                id="phoneNumber"
                type="tel"
                value={agencyWorker.phoneNumber}
                onChange={(e) => setAgencyWorker((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                placeholder="Worker's Phone Number"
                required
            />
            <MultiSelectLanguage
                selectedLanguages={agencyWorker.languages}
                onChange={(langs) => setAgencyWorker((prev) => ({ ...prev, languages: langs }))}
            />
            <Select
                value={agencyWorker.gender}
                onValueChange={(value) => setAgencyWorker((prev) => ({ ...prev, gender: value }))}
            >
                <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border focus:ring-[#145B10]">
                    <SelectValue placeholder="Select gender" />
                    <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
            </Select>
            <Input
                id="dateOfBirth"
                type="date"
                value={agencyWorker.dateOfBirth}
                onChange={(e) => setAgencyWorker((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
            />
            <Input
                id="nationalId"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                required
            />
            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 h-14 hover:bg-[#0F4D0C] transition-colors disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Add Worker"}
            </Button>
        </form>
    )
}

export default AgencyWorkerForm
