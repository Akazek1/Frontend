"use client";

import { AppHeader } from "@/components/ui/app-primitives";
import { useRouter } from "next/navigation";
import React from "react";

interface PageProp {
  text: string;
  className?: string | undefined;
  backHref?: string; // Optional: explicit back URL. If not provided, uses browser history (router.back())
  fallbackHref?: string; // Where to go if no browser history (defaults to /more)
}

const BackButtonHeader: React.FC<PageProp> = ({
  text,
  className,
  backHref,
  fallbackHref = "/more",
}) => {
  const router = useRouter();

  const handleBackClick = () => {
    if (!backHref) {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    }
  };

  return (
    <AppHeader
      title={text}
      backHref={backHref}
      onBack={backHref ? undefined : handleBackClick}
      className={className}
    />
  );
};

export default BackButtonHeader;
