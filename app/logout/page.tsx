"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "@/store/slices/auth-slice";
import type { AppDispatch } from "@/store";
import { persistor } from "@/store";
import authService from "@/services/auth-service";

export default function LogoutPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      await dispatch(logout());
      await persistor.purge();
      authService.logout();
      window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
      router.replace("/");
    };

    signOut();
  }, [dispatch, router]);

  return (
    <main className="flex min-h-screen items-center justify-center app-bg px-6">
      <p className="text-sm font-medium text-[#1F2937]">Signing out...</p>
    </main>
  );
}
