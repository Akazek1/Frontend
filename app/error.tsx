"use client"

import { useEffect, useState } from "react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module")

  // Has this tab already tried an auto-reload for this error?
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

  // First attempt: auto-reload is in flight — show a brief spinner
  if (isChunkError && reloading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-8 h-8 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    )
  }

  // Auto-reload already tried and still failing — ask the user to act
  if (isChunkError && alreadyReloaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
          <p className="text-4xl">🔄</p>
          <h1 className="text-lg font-bold text-gray-900">App updated</h1>
          <p className="text-sm text-gray-500">
            A new version of the app is available. Please refresh to continue.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem("_chunk_reload")
              window.location.reload()
            }}
            className="mt-2 px-6 py-3 bg-[#1B5E20] text-white text-sm font-semibold rounded-full hover:bg-[#145B10] transition-colors"
          >
            Refresh page
          </button>
        </div>
      </div>
    )
  }

  // All other errors — show a friendly message with a retry button
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
        <p className="text-4xl">😕</p>
        <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-2 px-6 py-3 bg-[#1B5E20] text-white text-sm font-semibold rounded-full hover:bg-[#145B10] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
