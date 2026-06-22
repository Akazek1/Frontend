"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const BookingsPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/work");
  }, [router]);

  return null;
};

export default BookingsPage;
