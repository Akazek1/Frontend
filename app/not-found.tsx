import Link from "next/link";
import { Search, Home, Briefcase, HelpCircle, ArrowRight, Sparkles } from "lucide-react";
import { colors } from "@/constant/colors";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-6 text-center" style={{ backgroundColor: colors.background }}>
      {/* Explicit Error Badge */}
      <div className="mb-4 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderColor: colors.borderSecondary, color: colors.textMuted, backgroundColor: "white" }}>
        Error 404 • Page Not Found
      </div>

      {/* 404 Visual Section - Reduced size */}
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl opacity-10 rounded-full scale-125" style={{ backgroundColor: colors.primary }}></div>
        <div className="relative bg-white p-6 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.02)] border-2" style={{ borderColor: colors.border }}>
          <Search className="w-12 h-12 opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: colors.primary }} />
          <div className="relative text-4xl font-black italic tracking-tighter" style={{ color: colors.primary }}>
            404
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: colors.text }}>
        Something went wrong.
      </h1>
      <p className="text-base mb-6 max-w-xs mx-auto leading-tight" style={{ color: colors.textSecondary }}>
        The link you followed might be broken, or the page may have been moved.
      </p>

      <div className="flex flex-col w-full max-w-xs gap-3 mb-8 mx-auto">
        <Link href="/" className="w-full">
          <Button className="w-full py-5 text-base font-bold shadow-md shadow-[#145B1015]" style={{ backgroundColor: colors.primary }}>
            <Home className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* "Important Info" / Quick Guide Section - More compact */}
      <div className="w-full max-w-md bg-white rounded-2xl p-5 text-left shadow-[0_4px_15px_rgba(20,91,16,0.04)] border" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-5 w-5 items-center justify-center rounded-md" style={{ backgroundColor: colors.backgroundTertiary, color: colors.primary }}>
            <Sparkles className="h-3 w-3" />
          </span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
            Quick Guide
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colors.backgroundTertiary }}>
              <Briefcase className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-0.5" style={{ color: colors.text }}>Verified Professionals</p>
              <p className="text-[10px] leading-tight opacity-80" style={{ color: colors.textSecondary }}>Trusted, ID-verified workers only.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colors.backgroundTertiary }}>
              <Search className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-0.5" style={{ color: colors.text }}>Simple Booking</p>
              <p className="text-[10px] leading-tight opacity-80" style={{ color: colors.textSecondary }}>Easy scheduling in a few taps.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: colors.backgroundTertiary }}>
              <HelpCircle className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-0.5" style={{ color: colors.text }}>Support Center</p>
              <p className="text-[10px] leading-tight opacity-80" style={{ color: colors.textSecondary }}>We&apos;re here to help you 24/7.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t" style={{ borderColor: colors.border }}>
          <Link href="/more/help" className="flex items-center justify-center text-xs font-black group" style={{ color: colors.primary }}>
            Visit Help Center
            <ArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
