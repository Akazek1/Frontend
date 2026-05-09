// app/providers.tsx or wherever your Providers file is
"use client";

import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./index"; // adjust path if needed

// Loading component shown while redux-persist rehydrates
const PersistLoading = () => (
  <div className="w-full h-screen flex items-center justify-center bg-[#F1FCEF]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#1B5E20] text-sm">Loading...</p>
    </div>
  </div>
);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <PersistGate loading={<PersistLoading />} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
}
