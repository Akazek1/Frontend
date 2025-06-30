import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type MultiSelectLanguageProps = {
    selectedLanguages: string[];
    onChange: (languages: string[]) => void;
};

const allLanguages = ["English", "Kinyarwanda", "Swahili", "French"];

export const MultiSelectLanguage = ({
    selectedLanguages,
    onChange,
}: MultiSelectLanguageProps) => {
    const [open, setOpen] = useState(false);

    const toggleLanguage = (lang: string) => {
        if (selectedLanguages.includes(lang)) {
            onChange(selectedLanguages.filter((l) => l !== lang));
        } else {
            onChange([...selectedLanguages, lang]);
        }
    };

    return (
        <div className="w-full relative">
            <Button
                variant="outline"
                className="relative w-full justify-between bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10]"
                onClick={() => setOpen(!open)}
            >
                <span>
                    {selectedLanguages.length > 0
                        ? selectedLanguages.join(", ")
                        : "Select languages"}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-black fill-black transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </Button>
            {open && (
                <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="flex flex-col">
                        {allLanguages.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => toggleLanguage(lang)}
                                className="flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 w-full"
                            >
                                {selectedLanguages.includes(lang) && (
                                    <Check className="w-4 h-4 text-green-600" />
                                )}
                                <span className={selectedLanguages.includes(lang) ? "font-medium" : ""}>
                                    {lang}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};