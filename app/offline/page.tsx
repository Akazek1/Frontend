import { AkazekLogo } from "@/components/brand/akazek-logo";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-6 py-10">
      <div className="w-full max-w-[360px] text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <AkazekLogo variant="mark" markClassName="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-[#111827]">You're offline</h1>
        <p className="mt-2 text-sm leading-6 text-[#4B5563]">
          Check your connection and try again. Recently opened pages may still be available.
        </p>
      </div>
    </main>
  );
}
