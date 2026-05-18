"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BookRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    // This page is no longer used — redirect to service details
    if (id) router.replace(`/service/${id}`);
    else router.replace("/");
  }, [id, router]);

  return null;
}
