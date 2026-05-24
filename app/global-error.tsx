"use client"

import { useEffect, useState } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Catches errors in the root layout (e.g. app/layout.js chunk failures)
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module")

  const alreadyReloaded =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem("_chunk_reload") === "1"

  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    if (isChunkError && !alreadyReloaded) {
      sessionStorage.setItem("_chunk_reload", "1")
      setReloading(true)
      window.location.reload()
    }
  }, [isChunkError, alreadyReloaded])

  if (isChunkError && reloading) {
    return (
      <html>
        <body style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", margin: 0, fontFamily: "sans-serif" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
            <div style={{ width: 32, height: 32, border: "2px solid #1B5E20", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Loading…</p>
          </div>
        </body>
      </html>
    )
  }

  if (isChunkError && alreadyReloaded) {
    return (
      <html>
        <body style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", margin: 0, fontFamily: "sans-serif" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center", padding: "0 24px", maxWidth: 360 }}>
            <p style={{ fontSize: 40, margin: 0 }}>🔄</p>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>App updated</h1>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
              A new version of the app is available. Please refresh to continue.
            </p>
            <button
              onClick={() => { sessionStorage.removeItem("_chunk_reload"); window.location.reload() }}
              style={{ marginTop: 8, padding: "12px 24px", background: "#1B5E20", color: "#fff", fontSize: 14, fontWeight: 600, borderRadius: 999, border: "none", cursor: "pointer" }}
            >
              Refresh page
            </button>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html>
      <body style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", margin: 0, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center", padding: "0 24px", maxWidth: 360 }}>
          <p style={{ fontSize: 40, margin: 0 }}>😕</p>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 8, padding: "12px 24px", background: "#1B5E20", color: "#fff", fontSize: 14, fontWeight: 600, borderRadius: 999, border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
