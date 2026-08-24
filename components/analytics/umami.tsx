import Script from "next/script";

/**
 * Umami — cookieless, privacy-friendly web analytics.
 *
 * Loaded only in production, so localhost/dev traffic is never counted. The
 * website id is public (it ships in the <script> tag on the live site), so a
 * default is fine here. Both values can be overridden with env vars, and
 * setting NEXT_PUBLIC_UMAMI_WEBSITE_ID to an empty string disables tracking.
 */
const DEFAULT_WEBSITE_ID = "2d82ae88-921e-406a-a6ff-0d8d09bfca99";
const DEFAULT_SRC = "https://cloud.umami.is/script.js";

export function UmamiAnalytics() {
  if (process.env.NODE_ENV !== "production") return null;

  const websiteId =
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID !== undefined
      ? process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
      : DEFAULT_WEBSITE_ID;
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC || DEFAULT_SRC;

  if (!websiteId) return null;

  return <Script src={src} data-website-id={websiteId} strategy="afterInteractive" />;
}
