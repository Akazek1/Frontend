import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import { persistStore, persistReducer } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

// Create a noop storage for SSR
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, _value: string) {
      return Promise.resolve();
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Determine storage based on environment
let storage;
if (typeof window !== "undefined") {
  try {
    storage = createWebStorage("local");
  } catch {
    storage = createNoopStorage();
  }
} else {
  storage = createNoopStorage();
}

// Redux Persist Configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
  timeout: 0,
};

// Persisted Reducer
const persistedReducer = persistReducer(persistConfig, authReducer);

// Store Configuration with Persisted Reducer
const store = configureStore({
  reducer: {
    auth: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


export { store, persistor };
