import { describe, it, expect, vi } from "vitest";
import type { Query } from "@tanstack/react-query";
import { shouldPersistQuery } from "@/lib/query-persistence";

// Avoid touching IndexedDB during import — we only exercise the pure filter.
vi.mock("idb-keyval", () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn() }));

const queryWith = (queryKey: unknown[]) => ({ queryKey } as unknown as Query);

describe("shouldPersistQuery", () => {
  it("persists the public browse-services list", () => {
    expect(
      shouldPersistQuery(queryWith(["services", "browse", { page: 1 }])),
    ).toBe(true);
  });

  it("persists the active-languages list", () => {
    expect(shouldPersistQuery(queryWith(["active-languages"]))).toBe(true);
  });

  it("does NOT persist auth-sensitive or unrelated queries", () => {
    // Guards against accidentally persisting private data to disk.
    expect(shouldPersistQuery(queryWith(["services", "detail", "abc"]))).toBe(false);
    expect(shouldPersistQuery(queryWith(["bookings"]))).toBe(false);
    expect(shouldPersistQuery(queryWith(["conversations", "inbox"]))).toBe(false);
    expect(shouldPersistQuery(queryWith(["user", "me"]))).toBe(false);
  });
});
