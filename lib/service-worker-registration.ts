export async function getAppServiceWorkerRegistration() {
  if (
    typeof window === "undefined" ||
    process.env.NODE_ENV === "development" ||
    !("serviceWorker" in navigator)
  ) {
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;

  return navigator.serviceWorker.ready;
}
