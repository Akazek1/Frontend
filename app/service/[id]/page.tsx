"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { getServiceDetailPath } from "@/lib/service-display";
import { colors } from "@/constant/colors";

/**
 * Legacy route — redirects /service/:id → /:handle/services/:id
 */
export default function ServiceRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params.id as string;
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!serviceId) return;

        async function redirect() {
            try {
                const res = await api.get(`/services/${serviceId}`);
                const service = res.data?.data || res.data;
                const path = getServiceDetailPath(service);
                router.replace(path);
            } catch {
                setError("Service not found");
            }
        }
        redirect();
    }, [serviceId, router]);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <p className="text-sm text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div
            className="flex min-h-screen items-center justify-center"
            style={{ backgroundColor: colors.background }}
        >
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
        </div>
    );
}
