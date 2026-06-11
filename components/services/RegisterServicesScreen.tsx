"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import servicesService from "@/services/services-service";
import { useServices } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  appStickyHeaderClass,
} from "@/components/ui/app-primitives";
import { getApiErrorMessage } from "@/lib/error-handler";

interface JobType {
  id: string;
  name: string;
  nameKn?: string | null;
  icon?: string | null;
}
interface Grouping {
  id: string;
  name: string;
  nameKn?: string | null;
  icon?: string | null;
  jobTypes: JobType[];
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-muted-foreground/20 text-foreground hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}

export function RegisterServicesScreen() {
  const router = useRouter();
  const { services, isLoading: servicesLoading, refetch } = useServices();

  const [tree, setTree] = useState<Grouping[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/taxonomy/tree");
        const data = res.data?.data ?? res.data ?? [];
        setTree(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Could not load services. Please try again.");
      } finally {
        setTreeLoading(false);
      }
    })();
  }, []);

  // Job types this worker already offers — shown as "Added", not selectable.
  const existingCategoryIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      const id = typeof s.category === "string" ? s.category : s.category?.id;
      if (id) set.add(id);
    }
    return set;
  }, [services]);

  // De-duped flat list honoring active grouping + search (a job type can
  // appear in multiple groupings, so we de-dupe by id).
  const visibleJobTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups =
      activeGroup === "all" ? tree : tree.filter((g) => g.id === activeGroup);
    const map = new Map<string, JobType>();
    for (const g of groups) {
      for (const jt of g.jobTypes) {
        if (q && !`${jt.name} ${jt.nameKn ?? ""}`.toLowerCase().includes(q))
          continue;
        if (!map.has(jt.id)) map.set(jt.id, jt);
      }
    }
    return [...map.values()];
  }, [tree, activeGroup, search]);

  const toggle = (id: string) => {
    if (existingCategoryIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRegister = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const result = await servicesService.register([...selected]);
      await refetch();
      toast.success(
        result.createdCount === 1
          ? "1 service added"
          : `${result.createdCount} services added`,
      );
      router.push("/more/services");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not register. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loading = treeLoading || servicesLoading;

  return (
    <PageShell padded={false} bottomNav={false}>
      <PageHeader
        title="Add Services"
        compact
        onBack={() => router.back()}
        className={appStickyHeaderClass}
      />

      <main className="flex flex-col px-4 pt-3 pb-28">
        <p className="mb-3 text-sm text-muted-foreground">
          Pick the services you offer. You can add a price and details later.
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            className="w-full rounded-xl border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>

        {/* Grouping filter chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip
            label="All"
            active={activeGroup === "all"}
            onClick={() => setActiveGroup("all")}
          />
          {tree.map((g) => (
            <FilterChip
              key={g.id}
              label={g.name}
              active={activeGroup === g.id}
              onClick={() => setActiveGroup(g.id)}
            />
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {visibleJobTypes.map((jt) => {
              const owned = existingCategoryIds.has(jt.id);
              const checked = selected.has(jt.id);
              return (
                <button
                  key={jt.id}
                  type="button"
                  disabled={owned}
                  onClick={() => toggle(jt.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    owned
                      ? "cursor-not-allowed bg-muted/30 opacity-60"
                      : checked
                        ? "border-brand bg-brand/5"
                        : "hover:bg-surface"
                  }`}
                >
                  <span>
                    <span className="font-medium">{jt.name}</span>
                    {jt.nameKn && (
                      <span className="block text-xs text-muted-foreground">
                        {jt.nameKn}
                      </span>
                    )}
                  </span>
                  {owned ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      Added
                    </span>
                  ) : (
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        checked
                          ? "border-brand bg-brand text-white"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </button>
              );
            })}
            {visibleJobTypes.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No services match.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Sticky register bar */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[428px] border-t bg-surface px-4 py-3">
        <Button
          type="button"
          className="w-full"
          disabled={selected.size === 0 || submitting}
          onClick={handleRegister}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {selected.size === 0
            ? "Select services to add"
            : `Register ${selected.size} service${selected.size > 1 ? "s" : ""}`}
        </Button>
      </div>
    </PageShell>
  );
}
