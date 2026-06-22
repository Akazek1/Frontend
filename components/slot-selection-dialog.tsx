"use client";

import React, { useState, useEffect } from "react";
import CustomDialog from "./custom-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Availability {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string;
    endTime: string;
}

interface SlotSelectionDialogProps {
    trigger: React.ReactNode;
    providerName: string;
    price: string;
    onConfirm: (selectedDate: string, selectedTime: string) => void;
    provider: { id: string; type: string };
    availability: Availability[];
}

const SlotSelectionDialog: React.FC<SlotSelectionDialogProps> = ({
    trigger,
    onConfirm,
    provider,
    availability,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableDates, setAvailableDates] = useState<{ day: string, date: number, dateString: string }[]>([]);
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const router = useRouter();

    // Convert dayOfWeek number to day name
    const getDayName = (dayOfWeek: number) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek];
    };

    // Convert time string to readable format
    const formatTime = (timeString: string) => {
        const time = new Date(timeString);
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    // Generate available dates for the next 2 weeks based on availability
    useEffect(() => {
        if (!availability || availability.length === 0) {
            return;
        }

        const today = new Date();
        const dates = [];

        // Get all available days of week
        const availableDays = [...new Set(availability.map(a => a.dayOfWeek))];

        // Generate dates for the next 14 days (2 weeks)
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            if (availableDays.includes(date.getDay())) {
                dates.push({
                    day: getDayName(date.getDay()).substring(0, 3), // Short day name (e.g., "Mon")
                    date: date.getDate(),
                    dateString: date.toISOString().split('T')[0] // YYYY-MM-DD format
                });
            }
        }

        setAvailableDates(dates);
    }, [availability]);

    // Generate time slots when a date is selected
    useEffect(() => {
        if (!selectedDate || !availability || availability.length === 0) return;

        const date = new Date(selectedDate);
        const dayOfWeek = date.getDay();

        // Find availability for this day of week
        const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);

        if (!dayAvailability) {
            return;
        }

        // Generate time slots (every 30 minutes between start and end)
        const slots = [];
        const start = new Date(dayAvailability.startTime);
        const end = new Date(dayAvailability.endTime);

        const current = new Date(start);

        while (current <= end) {
            slots.push(formatTime(current.toISOString()));
            current.setMinutes(current.getMinutes() + 30); // 30-minute intervals
        }

        setAvailableTimes(slots);
    }, [selectedDate, availability]);

    const handleDateSelect = (dateString: string) => {
        setSelectedDate(dateString);
        setSelectedTime(null); // Reset time when date changes
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    useEffect(() => {
        if (selectedDate && selectedTime) {
            onConfirm(selectedDate, selectedTime);
            setIsOpen(false);
            router.push(
                `/book/${provider.type}/${provider.id}/booking-summary?serviceId=${encodeURIComponent(
                    provider.id
                )}&date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}`
            );
        }
    }, [selectedDate, selectedTime, onConfirm, router, provider]);

    return (
        <div>
            <div onClick={() => setIsOpen(true)}>{trigger}</div>
            <CustomDialog isOpen={isOpen} onClose={() => setIsOpen(false)} className="p-2">
                <div className="space-y-6">
                    {/* Date Selection */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Select Date</h3>
                        {availableDates.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {availableDates.map((date) => (
                                    <div
                                        key={date.dateString}
                                        className={`flex flex-col items-center cursor-pointer p-3 rounded-lg border ${selectedDate === date.dateString
                                                ? "bg-brand text-white border-brand"
                                                : "bg-[#437C40] text-white border-brand hover:bg-[#618f5e]"
                                            }`}
                                        onClick={() => handleDateSelect(date.dateString)}
                                    >
                                        <span className="font-medium">{date.day}</span>
                                        <span className="font-bold">{date.date}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">No available dates found for this service</p>
                        )}
                    </div>

                    {/* Time Selection - Only show if a date is selected */}
                    {selectedDate && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Select Time</h3>
                            {availableTimes.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {availableTimes.map((time, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            className={`px-3  ${selectedTime === time
                                                    ? "bg-brand text-white border-brand"
                                                    : "bg-[#437C40] text-white border-brand hover:bg-[#618f5e]"
                                                }`}
                                            onClick={() => handleTimeSelect(time)}
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">No available times for selected date</p>
                            )}
                        </div>
                    )}
                </div>
            </CustomDialog>
        </div>
    );
};

export default SlotSelectionDialog;