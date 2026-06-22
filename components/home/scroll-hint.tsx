"use client";
import { ChevronDown } from "lucide-react";

const ScrollHint: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-1 py-2">
    <p className="text-xs text-ink-muted font-medium">Scroll down to see services</p>
    <div className="animate-bounce">
      <ChevronDown className="w-4 h-4 text-brand" />
    </div>
  </div>
);

export default ScrollHint;
