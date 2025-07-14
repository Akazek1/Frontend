'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { Calendar, CheckCircle, Circle, Clock, DollarSign, Loader2, MapPin, User } from 'lucide-react';
import BackButtonHeader from '@/components/header/back-button-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Booking {
    id: string;
    service: {
        id: string;
        title: string;
        description: string;
        price: number;
        providerId: string;
        workerId: string;
        category: string;
        serviceType: string;
        serviceAreas: string[];
        serviceImage: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        provider: {
            id: string;
            phoneNumber: string;
            firstName: string;
            lastName: string;
            email: string;
            userType: string;
            profilePicture: string;
        };
    };
    address: {
        id: string;
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        latitude: number | null;
        longitude: number | null;
        isDefault: boolean;
        userId: string;
        createdAt: string;
        updatedAt: string;
    };
    status: string;
    scheduledFor: string;
    price: number;
    createdAt: string;
    updatedAt: string;
    worker: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
        gender: string;
        languages: string[];
        dateOfBirth: string;
    };
    user: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
        userType: string;
        profilePicture: string;
    };
}

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

const BookingDetails: React.FC = () => {
    const { id } = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState<string>('');
    const [otpSent, setOtpSent] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('');
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<boolean>(false);
    const [testOtp, setTestOtp] = useState<string | null>(null);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);

    const TEST_PHONE_NUMBERS = ['9999999999', '9999999991'];
    const STATIC_OTP = '111111';

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                setLoading(true);
                const response = await api.get<{ data: Booking }>(`/bookings/${id}`, {
                    withCredentials: true,
                });
                setBooking(response.data.data);
                setStatus(response.data.data.status);
                setError(null);
            } catch {
                setError('Failed to fetch booking');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    const fetchTestOtp = async () => {
        try {
            const response = await api.get(`/bookings/${id}/otp`, {
                withCredentials: true,
            });
            setTestOtp(response.data.otp);
            return response.data.otp;
        } catch (err) {
            console.error('Failed to fetch test OTP:', err);
            return null;
        }
    };

    const handleSendOtp = async () => {
        if (!status) {
            setUpdateError('Please select a status before sending OTP');
            return;
        }
        try {
            setUpdating(true);
            setUpdateError(null);
            const response = await api.patch(
                `/bookings/${id}/status`,
                { status },
                { withCredentials: true }
            );

            if (response.data.message === 'Success') {
                setOtpSent(true);
                setIsOtpModalOpen(true);
                if (TEST_PHONE_NUMBERS.includes(booking?.user.phoneNumber || '')) {
                    const testOtpValue = await fetchTestOtp();
                    console.log(`Test OTP for ${booking?.user.phoneNumber}: ${testOtpValue}`);
                } else {
                    console.log(`Real OTP sent to ${booking?.user.phoneNumber}`);
                }
            }
        } catch (err) {
            const error = err as AxiosError;
            setUpdateError('Failed to send OTP');
            console.error('Error sending OTP:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            setUpdating(true);
            setUpdateError(null);
            const isTestPhone = TEST_PHONE_NUMBERS.includes(booking?.user.phoneNumber || '');
            const validOtp = isTestPhone ? (testOtp || STATIC_OTP) : otp;

            if (!otp) {
                setUpdateError('Please enter an OTP');
                return;
            }

            if (otp !== validOtp) {
                setUpdateError('Invalid OTP');
                return;
            }

            const response = await api.patch(
                `/bookings/${id}/status`,
                { status, otp },
                { withCredentials: true }
            );

            setBooking((prev) => (prev ? { ...prev, status } : null));
            setOtp('');
            setOtpSent(false);
            setTestOtp(null);
            setUpdateError(null);
            setIsOtpModalOpen(false);
            console.log('Status updated successfully:', response.data);
        } catch (err) {
            const error = err as AxiosError;
            setUpdateError('Failed to update status');
            console.error('Error updating status:', error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <Circle className="text-red-500 text-4xl mb-4" />
                <p className="text-red-500 text-center mb-4">{error || 'Booking not found'}</p>
                <Button
                    onClick={() => router.push('/bookings')}
                    className="px-6 py-2 bg-[#145B10] text-white rounded-lg hover:bg-[#0e4710] transition-colors"
                >
                    Back to Bookings
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <BackButtonHeader text="Booking Details" className="p-4" backHref="/" />

            <div className="p-4 max-w-2xl mx-auto">
                {/* Service Card */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="relative h-48 w-full">
                        <Image
                            src={booking.service.serviceImage}
                            alt={booking.service.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                            <h2 className="text-lg capitalize font-bold text-primary">{booking.service.title}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                                {booking.status}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{booking.service.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center text-primary gap-2">
                                <DollarSign className="w-4 h-4 text-[#145B10]" />
                                <span>${booking.price}</span>
                            </div>
                            <div className="flex items-center text-primary gap-2">
                                <Calendar className="w-4 h-4 text-[#145B10]" />
                                <span>{new Date(booking.scheduledFor).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center text-primary gap-2">
                                <Clock className="w-4 h-4 text-[#145B10]" />
                                <span>{new Date(booking.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* People Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* User Card */}
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <User className="mr-2 w-6 h-6 text-[#145B10]" />
                            Customer
                        </h3>
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                                {booking.user?.profilePicture ? (
                                    <Image
                                        src={booking.user.profilePicture}
                                        alt={`${booking.user.firstName} ${booking.user.lastName}`}
                                        width={40}
                                        height={40}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        <User />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{booking.user?.firstName} {booking.user?.lastName}</p>
                                <p className="text-xs text-gray-500">{booking.user?.phoneNumber}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600">{booking.user?.email}</p>
                    </div>

                    {/* Worker Card */}
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <User className="mr-2 w-6 h-6 text-[#145B10]" />
                            Worker
                        </h3>
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                                <User />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{booking.worker.firstName} {booking.worker.lastName}</p>
                                <p className="text-xs text-gray-500">{booking.worker.phoneNumber}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600">{booking.worker.email}</p>
                    </div>
                </div>

                {/* Address Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="mr-2 w-6 h-6 text-[#145B10]" />
                        Service Address
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2 text-sm font-semibold">
                        <p className="text-gray-700">{booking.address.street}</p>
                        <p className="text-gray-700">{booking.address.city}, {booking.address.state}</p>
                        <p className="text-gray-700">{booking.address.country} - {booking.address.postalCode}</p>
                    </div>
                </div>

                {/* Status Update Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3">Update Booking Status</h3>

                    <Select
                        value={status}
                        onValueChange={(value) => setStatus(value)}
                        disabled={otpSent || updating}
                    >
                        <SelectTrigger className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#145B10] text-sm">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            {/* <SelectItem value="CONFIRMED">Confirmed</SelectItem> */}
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            {/* <SelectItem value="CANCELLED">Cancelled</SelectItem> */}
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={handleSendOtp}
                        disabled={updating || otpSent || !status}
                        className="w-full bg-[#167021] mt-4 text-white rounded-full font-bold leading-6 h-12 hover:bg-[#0F4D0C] transition-colors"
                    >
                        {updating ? (
                            <>
                                <Loader2 className="animate-spin mr-2 w-4 h-4" />
                                Sending OTP...
                            </>
                        ) : (
                            'Send OTP to Customer'
                        )}
                    </Button>

                    {updateError && !isOtpModalOpen && (
                        <div className="mt-3 p-2 bg-red-50 text-red-600 text-sm rounded-lg">
                            {updateError}
                        </div>
                    )}
                </div>

                {/* OTP Modal */}
                <Dialog open={isOtpModalOpen} onOpenChange={(open) => {
                    setIsOtpModalOpen(open);
                    if (!open) {
                        setOtp('');
                        setUpdateError(null);
                    }
                }}>
                    <DialogContent className="w-[360px]  sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                                Enter OTP
                                {/* <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOtpModalOpen(false)}
                                    className="absolute right-4 top-4"
                                >
                                    <X className="h-4 w-4" />
                                </Button> */}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                OTP sent to {booking?.user?.phoneNumber}
                                {TEST_PHONE_NUMBERS.includes(booking?.user.phoneNumber || '') && testOtp && (
                                    <span className="ml-2 text-xs text-gray-500">(Test OTP: {testOtp})</span>
                                )}
                            </p>
                            <Input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#145B10] text-sm"
                                maxLength={6}
                            />
                            {updateError && (
                                <div className="p-2 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {updateError}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleUpdateStatus}
                                disabled={updating || !otp}
                                className="w-full flex justify-center items-center py-3 bg-[#145B10] text-white rounded-lg hover:bg-[#0e4710] transition-colors disabled:opacity-70 text-sm"
                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 w-4 h-4" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 w-4 h-4" />
                                        Verify OTP & Update Status
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default BookingDetails;