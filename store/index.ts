import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import { persistStore, persistReducer } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

// Create a noop storage for SSR (server-side rendering)
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use localStorage on client, noop storage on server
const storage = typeof window !== "undefined" 
  ? createWebStorage("local")
  : createNoopStorage();

// Redux Persist Configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
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
