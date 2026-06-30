import { test, expect } from "@playwright/test";

/**
 * These guard the PWA promises that unit tests cannot: that the service worker
 * actually registers, that the manifest is installable, and that a cold launch
 * with no network falls back to the offline page instead of the browser error.
 *
 * NOTE: the offline fallback is served via a `fallbacks` catch handler (only
 * when the network fails), NOT an unconditional `navigateFallback` — otherwise
 * the SW would serve the offline page for EVERY navigation, even online. The
 * "online navigation shows the real app" test below guards exactly that.
 */

test.describe("PWA runtime", () => {
  test("serves an installable web app manifest", async ({ page }) => {
    const res = await page.goto("/manifest.webmanifest");
    expect(res?.ok()).toBeTruthy();
    const manifest = await res!.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons?.length).toBeGreaterThan(0);
  });

  test("registers the service worker at the root scope", async ({ page }) => {
    await page.goto("/");
    const scope = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.scope;
    });
    expect(scope).toContain("/");
  });

  test("serves the real app (not the offline page) when online", async ({ page }) => {
    // Warm + take control of the SW, then navigate online. Regression guard:
    // an unconditional navigateFallback would serve the offline page here.
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(1500);
    await page.reload();

    await page.goto("/more", { waitUntil: "networkidle" });
    await expect(page.getByText(/you'?re offline/i)).toHaveCount(0);
  });

  test("shows the offline fallback on a cold launch with no network", async ({
    page,
    context,
  }) => {
    // Warm the SW so it controls the page and the shell is precached.
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(1500);

    // Cut the network and cold-navigate to a route that needs the document.
    // (Avoid /jobs and /bookings — middleware 301-redirects those.)
    await context.setOffline(true);
    await page.goto("/more", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/you'?re offline/i)).toBeVisible();

    await context.setOffline(false);
  });
});
