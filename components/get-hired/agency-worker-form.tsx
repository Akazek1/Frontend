"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Loader2, Trash2, Pencil, XCircle, User, Mail, Phone, Languages, VenusAndMars } from "lucide-react"
import { MultiSelectLanguage } from "../multi-language-select"
import toast from "react-hot-toast"
import { Label } from "../ui/label"

// Native <input type="date"> renders its visible text using the device's OS
// locale (e.g. iOS often shows "Jul 7, 2003"), which we can't override via
// CSS/JS. Rwanda reads dates as dd/mm/yyyy, so format it ourselves.
const formatDateDMY = (value: string) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

// Define interfaces
interface AgencyWorker {
    id?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    dateOfBirth: string;
    languages: string[];
    gender: string;
}

const AgencyWorkerManagement: React.FC = () => {
    const t = useTranslations("agencyWorkerForm")
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
    const [workerList, setWorkerList] = useState<AgencyWorker[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error] = useState<string | null>(null)
    const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)

    useEffect(() => {
        setWorkerList([])
        setIsLoading(false)
    }, [])

    // Validate form data
    const validateForm = (workerData: AgencyWorker, file: File | null): string | null => {
        if (!workerData.firstName.trim()) return t("firstNameRequired")
        if (!workerData.lastName.trim()) return t("lastNameRequired")
        if (!workerData.phoneNumber.trim()) return t("phoneRequired")
        if (!workerData.email.trim()) return t("emailRequired")
        if (!workerData.dateOfBirth) return t("dobRequired")
        if (workerData.languages.length === 0) return t("languageRequired")

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(workerData.email.trim())) return t("invalidEmailFormat")

        const phoneRegex = /^\+?[\d\s-]{10,}$/
        if (!phoneRegex.test(workerData.phoneNumber.trim())) return t("invalidPhoneFormat")

        const dob = new Date(workerData.dateOfBirth)
        const today = new Date()
        const age = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()
        const dayDiff = today.getDate() - dob.getDate()
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

        if (isNaN(dob.getTime()) || adjustedAge <= 18) {
            return t("mustBeOlder18")
        }

        if (!editingWorkerId && !file) return t("nationalIdRequired")

        return null
    }

    // handle add or update worker
    const handleAddOrUpdateAgencyWorker = async (workerData: AgencyWorker, file: File | null) => {
        try {
            setIsLoading(true);

            const validationError = validateForm(workerData, file);
            if (validationError) {
                toast.error(validationError);
                return;
            }

            // Ensure all fields are strings
            const formData = new FormData()
            formData.append("firstName", workerData.firstName.trim())
            formData.append("lastName", workerData.lastName.trim())
            formData.append("phoneNumber", workerData.phoneNumber.trim())
            formData.append("email", workerData.email.trim())
            if (workerData.dateOfBirth) {
                formData.append("dateOfBirth", workerData.dateOfBirth)
            }
            formData.append("languages", JSON.stringify(workerData.languages.map((lang) => lang.trim())))
            if (workerData.gender) {
                formData.append("gender", workerData.gender)
            }
            if (file) {
                formData.append("file", file)
            }

            toast.success(t("comingSoon"));

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
            setEditingWorkerId(null);

            const fileInput = document.getElementById("nationalId") as HTMLInputElement | null;
            if (fileInput) fileInput.value = "";
        } catch (error: unknown) {
            const message =
                typeof error === "object" &&
                    error !== null &&
                    "response" in error &&
                    (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
                    ? Array.isArray(
                        (error as { response: { data: { message: string | string[] } } }).response.data.message
                    )
                        ? (error as { response: { data: { message: string[] } } }).response.data.message.join(", ")
                        : (error as { response: { data: { message: string } } }).response.data.message
                    : t("failedUpdateWorker");
            console.error("Error:", message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };


    const handleDeleteWorker = async (workerId: string) => {
        try {
            setIsLoading(true)
            toast.success(t("comingSoon"));
            void workerId;
        } catch {
            toast.error(t("failedDeleteWorker"));
        } finally {
            setIsLoading(false)
        }
    }


    // scroll to top while editing the worker
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle edit button click
    const handleEditWorker = (worker: AgencyWorker) => {
        setAgencyWorker({
            firstName: worker.firstName,
            lastName: worker.lastName,
            phoneNumber: worker.phoneNumber,
            email: worker.email,
            dateOfBirth: worker.dateOfBirth ? worker.dateOfBirth.split('T')[0] : '',
            languages: worker.languages,
            gender: worker.gender || '',
        })
        setEditingWorkerId(worker.id || null)
        setNationalIdFile(null)
        scrollToTop();
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        await handleAddOrUpdateAgencyWorker(agencyWorker, nationalIdFile)
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-8">
            {/* Worker Form */}
            <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center mb-5">
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">{t("firstNameLabel")}</Label>
                    <Input
                        id="firstName"
                        value={agencyWorker.firstName}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-brand"
                        placeholder={t("firstNameLabel")}
                        required
                    />
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">{t("lastNameLabel")}</Label>
                    <Input
                        id="lastName"
                        value={agencyWorker.lastName}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-brand"
                        placeholder={t("lastNameLabel")}
                        required
                    />
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">{t("emailLabel")}</Label>
                    <Input
                        id="email"
                        type="email"
                        value={agencyWorker.email}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, email: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-brand"
                        placeholder={t("emailLabel")}
                        required
                    />
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">{t("phoneLabel")}</Label>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        value={agencyWorker.phoneNumber}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-brand"
                        placeholder={t("phoneLabel")}
                        required
                    />
                </div>
                <MultiSelectLanguage
                    selectedLanguages={agencyWorker.languages}
                    onChange={(langs) => setAgencyWorker((prev) => ({ ...prev, languages: langs }))}
                    label={t("languagesLabel")}
                />
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">{t("genderLabel")}</Label>
                    <Select
                        value={agencyWorker.gender}
                        onValueChange={(value) => setAgencyWorker((prev) => ({ ...prev, gender: value }))}
                    >
                        <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border focus:ring-brand">
                            <SelectValue placeholder={t("selectGender")} />
                            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">{t("male")}</SelectItem>
                            <SelectItem value="FEMALE">{t("female")}</SelectItem>
                            <SelectItem value="OTHER">{t("other")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">{t("dobLabel")}</Label>
                    {/* Native picker stays interactive (opacity-0, tap opens the OS
                        date picker) but its own text render — which overflows on
                        iOS and always follows device locale — is hidden. The
                        visible label is our own dd/mm/yyyy formatting. */}
                    <div className="relative">
                        <input
                            id="dateOfBirth"
                            type="date"
                            value={agencyWorker.dateOfBirth}
                            onChange={(e) => setAgencyWorker((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                            aria-label={t("dobAriaLabel")}
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        />
                        <div className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border pointer-events-none overflow-hidden">
                            <span className={agencyWorker.dateOfBirth ? "" : "text-secondary-foreground/50"}>
                                {agencyWorker.dateOfBirth ? formatDateDMY(agencyWorker.dateOfBirth) : t("dobPlaceholder")}
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] text-secondary-foreground/50">{t("mustBeOlderHint")}</span>
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">{t("nationalIdLabel")}</Label>
                    <Input
                        id="nationalId"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-brand"
                        required={!editingWorkerId}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 h-14 hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : editingWorkerId ? t("updateWorker") : t("addWorker")}
                </Button>
            </form>

            {/* Worker List as Cards */}
            <div className="pb-5">
                <Label className="text-lg font-semibold">{t("yourWorkers")}</Label>
                {/* Status Messages */}
                {isLoading && (
                    <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                        <span className="text-gray-600">{t("loadingWorkers")}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Worker Cards Grid */}
                {!isLoading && workerList.length > 0 && (
                    <div className="grid grid-cols-1 gap-5">
                        {workerList.map((worker) => (
                            <div
                                key={worker.id}
                                className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 text-brand rounded-full h-6 w-6 flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className=" min-w-0 ">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {worker.firstName} {worker.lastName}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className=" border-t border-gray-100 flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditWorker(worker)}
                                            className="text-brand hover:text-brand/50 border-blue-200 hover:bg-blue-50"
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />

                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteWorker(worker.id || '')}
                                            className="text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />

                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="truncate">{worker.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{worker.phoneNumber || t("notProvided")}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Languages className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{worker.languages?.join(", ") || t("none")}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <VenusAndMars className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{worker.gender || t("notSpecified")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AgencyWorkerManagement
