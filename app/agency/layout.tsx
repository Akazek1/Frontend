"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AgencyProvider } from "@/context/agency-context";
import { AgencyShell } from "@/components/agency/agency-shell";
import { colors } from "@/constant/colors";

function AgencyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isAgency = Boolean(user?.roles?.includes("STAFFING_AGENCY" as never));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (user && !isAgency) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, isAgency, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3]">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  if (!isAgency) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-6 text-center">
        <div>
          <p className="text-[16px] font-bold text-ink">Agency access only</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            This area is for staffing agency accounts.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgencyGuard>
      <AgencyProvider>
        <AgencyShell>{children}</AgencyShell>
      </AgencyProvider>
    </AgencyGuard>
  );
}
