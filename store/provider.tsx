"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./index";
import { isServerRenderedPublicPath } from "@/lib/marketing-host";

// Shown only during redux-persist rehydration (normally a few ms). Replaces the
// previous `loading={null}`, which rendered a fully blank screen if rehydration
// ever stalled.
function RehydrationSplash() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-surface">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-strong border-t-transparent" />
        </div>
    );
}

export function Providers({
    children,
    isMarketingHost = false,
}: {
    children: React.ReactNode;
    isMarketingHost?: boolean;
}) {
    const pathname = usePathname();
    // PersistGate is never "bootstrapped" on the server, so gating everything
    // behind it meant the server-sent HTML of EVERY page was just the splash —
    // crawlers that don't run JS saw no content at all. Public pages render
    // straight through (server and first client render both use the initial
    // store state, so hydration matches); the app proper still waits for
    // rehydration so auth-dependent screens never flash a logged-out state.
    const renderBeforeRehydration = isServerRenderedPublicPath(pathname, isMarketingHost);

    return (
        <Provider store={store}>
            <PersistGate persistor={persistor}>
                {(bootstrapped) =>
                    bootstrapped || renderBeforeRehydration ? children : <RehydrationSplash />
                }
            </PersistGate>
        </Provider>
    );
}
