import { Suspense } from "react";
import Homepage from "./(home)/overview/page";

export default function Page() {
  return (
    <main className="min-h-[200vh]">
      <Suspense fallback={<div>Loading...</div>}>
        <Homepage />
      </Suspense>
    </main>
  );
}
