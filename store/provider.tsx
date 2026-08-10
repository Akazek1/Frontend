"use client";

import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./index";

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

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <PersistGate loading={<RehydrationSplash />} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
}
