import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAddServiceForm } from "@/hooks/useAddServiceForm";
import servicesService from "@/services/services-service";
import type { Service } from "@/types";

vi.mock("@/services/services-service", () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
  },
  fromBackendPriceFields: (s: { priceMin?: number; priceMax?: number; priceType?: string }) => ({
    price: s.priceMax ?? s.priceMin ?? 0,
    chargedPer:
      s.priceType === "weekly"
        ? "weekly"
        : s.priceType === "monthly"
        ? "monthly"
        : s.priceType === "one_time" || s.priceType === "fixed"
        ? "one_time"
        : "daily",
  }),
}));

const STORAGE_PREFIX = "hwa.addServiceForm.";

const buildExistingService = (): Service => ({
  service: {} as Record<string, unknown>,
  id: "svc-edit",
  title: "Existing service",
  description: "An existing description",
  priceMin: 2500,
  priceMax: 2500,
  priceType: "weekly",
  category: { id: "cat-1", name: "Cleaning" },
  serviceImage: "https://cdn.example/img1.jpg",
  serviceImages: ["https://cdn.example/img1.jpg"],
  isActive: true,
  providerId: "u1",
  provider: {
    id: "u1",
    firstName: "Prisca",
    lastName: "Mwanje",
    email: "",
  },
  reviews: { averageRating: 0, totalReviews: 0 },
  serviceAreas: ["Gasabo"],
});

describe("useAddServiceForm — state machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("starts empty for a brand-new service and is not yet valid", () => {
    const { result } = renderHook(() => useAddServiceForm());

    expect(result.current.form.title).toBe("");
    expect(result.current.form.chargedPer).toBe("daily"); // sensible default
    expect(result.current.isStep1Valid).toBe(false);
    expect(result.current.isStep2Valid).toBe(false);
  });

  it("flips isStep1Valid only once category, price > 0, and chargedPer are present", () => {
    const { result } = renderHook(() => useAddServiceForm());

    act(() => result.current.setField("categoryId", "cat-1"));
    expect(result.current.isStep1Valid).toBe(false);

    act(() => result.current.setField("price", "0"));
    expect(result.current.isStep1Valid).toBe(false); // 0 must not count

    act(() => result.current.setField("price", "2500"));
    expect(result.current.isStep1Valid).toBe(true);
  });

  it("requires title, description, and at least one image to validate step 2", () => {
    const { result } = renderHook(() => useAddServiceForm());

    act(() => {
      result.current.setField("title", "Deep cleaning");
      result.current.setField("description", "Includes everything");
    });
    expect(result.current.isStep2Valid).toBe(false);

    const fakeFile = new File(["data"], "x.jpg", { type: "image/jpeg" });
    act(() => result.current.addImageFiles([fakeFile]));

    expect(result.current.isStep2Valid).toBe(true);
  });

  it("caps newImageFiles at maxImages and ignores extras", () => {
    const { result } = renderHook(() => useAddServiceForm());

    const files = Array.from({ length: 7 }, (_, i) =>
      new File(["x"], `${i}.jpg`, { type: "image/jpeg" }),
    );
    act(() => result.current.addImageFiles(files));

    expect(result.current.totalImageCount).toBe(result.current.maxImages);
  });

  it("removeImageAt deletes from the merged (existing + new) array by index", () => {
    const { result } = renderHook(() =>
      useAddServiceForm({ service: buildExistingService() }),
    );

    // Existing service starts with 1 URL.
    expect(result.current.form.existingImageUrls).toHaveLength(1);

    const f1 = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const f2 = new File(["b"], "b.jpg", { type: "image/jpeg" });
    act(() => result.current.addImageFiles([f1, f2]));
    expect(result.current.totalImageCount).toBe(3);

    // Remove the first (existing URL)
    act(() => result.current.removeImageAt(0));
    expect(result.current.form.existingImageUrls).toHaveLength(0);
    expect(result.current.form.newImageFiles).toHaveLength(2);

    // Remove the second slot (now the second file)
    act(() => result.current.removeImageAt(1));
    expect(result.current.form.newImageFiles).toHaveLength(1);
    expect(result.current.form.newImageFiles[0].name).toBe("a.jpg");
  });

  it("rehydrates from sessionStorage on first paint when no edit service is provided", async () => {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}new`,
      JSON.stringify({
        categoryId: "cat-1",
        price: "5000",
        chargedPer: "weekly",
        title: "Recovered",
        description: "Recovered desc",
        existingImageUrls: ["https://cdn.example/old.jpg"],
      }),
    );

    const { result } = renderHook(() => useAddServiceForm());

    await waitFor(() => expect(result.current.form.title).toBe("Recovered"));
    expect(result.current.form.price).toBe("5000");
    expect(result.current.form.chargedPer).toBe("weekly");
    expect(result.current.form.existingImageUrls).toEqual([
      "https://cdn.example/old.jpg",
    ]);
  });

  it("persists every change back to sessionStorage", async () => {
    const { result } = renderHook(() => useAddServiceForm());

    act(() => {
      result.current.setField("title", "Persisted title");
      result.current.setField("price", "3000");
    });

    await waitFor(() => {
      const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}new`);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.title).toBe("Persisted title");
      expect(parsed.price).toBe("3000");
    });
  });

  it("pre-fills from an existing service in edit mode", () => {
    const { result } = renderHook(() =>
      useAddServiceForm({ service: buildExistingService() }),
    );

    expect(result.current.form.title).toBe("Existing service");
    expect(result.current.form.chargedPer).toBe("weekly");
    expect(result.current.form.price).toBe("2500");
    expect(result.current.form.existingImageUrls).toEqual([
      "https://cdn.example/img1.jpg",
    ]);
  });

  it("submit() throws when the form isn't valid", async () => {
    const { result } = renderHook(() => useAddServiceForm());

    await expect(result.current.submit()).rejects.toThrow(/not yet valid/i);
  });

  it("submit() calls servicesService.create and clears sessionStorage on success", async () => {
    (servicesService.create as any).mockResolvedValue({ id: "svc-new" });

    const { result } = renderHook(() => useAddServiceForm());

    act(() => {
      result.current.setField("categoryId", "cat-1");
      result.current.setField("price", "2500");
      result.current.setField("title", "Deep clean");
      result.current.setField("description", "Includes mopping");
      result.current.addImageFiles([
        new File(["x"], "x.jpg", { type: "image/jpeg" }),
      ]);
    });

    await waitFor(() => expect(result.current.isStep2Valid).toBe(true));

    await act(async () => {
      await result.current.submit();
    });

    expect(servicesService.create).toHaveBeenCalledTimes(1);
    const arg = (servicesService.create as any).mock.calls[0][0];
    expect(arg.title).toBe("Deep clean");
    expect(arg.price).toBe(2500);
    expect(arg.chargedPer).toBe("daily");
    expect(window.sessionStorage.getItem(`${STORAGE_PREFIX}new`)).toBeNull();
  });

  it("submit() routes to update() when the form was built from an existing service", async () => {
    (servicesService.update as any).mockResolvedValue({ id: "svc-edit" });

    const { result } = renderHook(() =>
      useAddServiceForm({ service: buildExistingService() }),
    );

    await waitFor(() => expect(result.current.isStep2Valid).toBe(true));

    await act(async () => {
      await result.current.submit();
    });

    expect(servicesService.update).toHaveBeenCalledWith(
      "svc-edit",
      expect.objectContaining({ price: 2500, chargedPer: "weekly" }),
    );
    expect(servicesService.create).not.toHaveBeenCalled();
  });
});
