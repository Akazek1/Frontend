function parseStoredValue(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getPersistedAuthValue(key: "token" | "user"): unknown {
  if (typeof window === "undefined") return null;

  try {
    const persistedRoot = localStorage.getItem("persist:root");
    if (!persistedRoot) return null;

    const root = JSON.parse(persistedRoot);
    const nestedAuth = parseStoredValue(root.auth);
    if (nestedAuth && typeof nestedAuth === "object" && key in nestedAuth) {
      return parseStoredValue((nestedAuth as Record<string, unknown>)[key]);
    }

    return parseStoredValue(root[key]);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (token) return token;

  const persistedToken = getPersistedAuthValue("token");
  return typeof persistedToken === "string" && persistedToken ? persistedToken : null;
}

export function getStoredAuthUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem("user");
  if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
    try {
      return JSON.parse(storedUser) as T;
    } catch {
      localStorage.removeItem("user");
    }
  }

  const persistedUser = getPersistedAuthValue("user");
  return persistedUser && typeof persistedUser === "object" ? (persistedUser as T) : null;
}
