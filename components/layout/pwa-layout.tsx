"use client";

import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen max-w-[428px] mx-auto overflow-hidden bg-background">
      {/* Main Content */}
      {children}
    </div>
  );
}
