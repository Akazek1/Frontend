"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  GripVertical,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { BOOKING_STATUS } from "@/constant";
import { ReportModal } from "../provider/report-modal";
import {
  AppButton,
  FormField,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
  appCardClass,
  appInputClass,
  appPrimaryButtonClass,
  appSecondaryButtonClass,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  bookingId: string;
  createdById: string | null;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  completedById?: string | null;
  isCanceled: boolean;
  canceledAt?: string | null;
  canceledById?: string | null;
  sortOrder: number;
  createdAt: string;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }
  return fallback;
}

function fmtDateTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Resolve an actor id to its booking role for captions / activity. */
function roleOf(
  id: string | null | undefined,
  employerId: string,
  workerId: string,
  labels: { employer: string; worker: string; someone: string },
): string {
  if (id && id === employerId) return labels.employer;
  if (id && id === workerId) return labels.worker;
  return labels.someone;
}

// ---------------------------------------------------------------------------
// Task detail — activity log + employer-only edit + cancel/uncancel
// ---------------------------------------------------------------------------

interface TaskDetailViewProps {
  task: Task;
  employerId: string;
  workerId: string;
  isEmployer: boolean;
  jobEditable: boolean;
  onBack: () => void;
  onUpdate: (updated: Task) => void;
}

function TaskDetailView({ task, employerId, workerId, isEmployer, jobEditable, onBack, onUpdate }: TaskDetailViewProps) {
  const t = useTranslations("taskDrawer");
  const roleLabels = { employer: t("roleEmployer"), worker: t("roleWorker"), someone: t("roleSomeone") };
  const [isSaving, setIsSaving] = useState(false);
  const [isActing, setIsActing] = useState<"cancel" | null>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const isActive = !task.isCompleted && !task.isCanceled;
  // Only the employer edits text, and only on an active task while the job is live.
  const canEdit = isEmployer && jobEditable && isActive;

  const handleSave = async () => {
    if (!canEdit || !title.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const res = await api.patch<{ data: Task }>(`/bookings/${task.bookingId}/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim(),
      });
      onUpdate(res.data.data);
      toast.success(t("taskUpdated"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("failedToUpdateTask")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelToggle = async () => {
    if (!jobEditable || isActing) return;
    setIsActing("cancel");
    try {
      const res = await api.patch<{ data: Task }>(`/bookings/${task.bookingId}/tasks/${task.id}`, {
        isCanceled: !task.isCanceled,
      });
      onUpdate(res.data.data);
      toast.success(task.isCanceled ? t("taskRestored") : t("taskCanceled"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("failedToUpdateTask")));
    } finally {
      setIsActing(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader
        title={t("detailTitle")}
        leading={
          <button onClick={onBack} className="rounded-full p-1.5 text-ink transition-colors hover:bg-gray-100" aria-label={t("backToTasks")}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* Title + role */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
              task.isCompleted ? "border-brand bg-brand" : task.isCanceled ? "border-gray-300" : "border-gray-300",
            )}
          >
            {task.isCompleted && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
          <div>
            <p className={cn("text-[15px] font-semibold", task.isCanceled ? "text-gray-400 line-through" : task.isCompleted ? "text-gray-400" : "text-ink")}>
              {task.title}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-brand">
              {t("addedBy", { role: roleOf(task.createdById, employerId, workerId, roleLabels) })}
            </p>
          </div>
        </div>

        {/* Status hint */}
        <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-[12px]", task.isCanceled ? "bg-red-50 text-red-600" : "bg-surface text-brand")}>
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          {task.isCanceled ? t("canceledNotice") : t("activeNotice")}
        </div>

        {/* Details — read-only for worker, editable for employer on an active task */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">{t("details")}</p>
          {canEdit ? (
            <div className={cn(appCardClass, "space-y-3")}>
              <FormField label={t("taskTitleLabel")}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={cn(appInputClass, "mt-2")}
                />
              </FormField>
              <FormField label={t("notes")} hint={t("optional")}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("noAdditionalNotes")}
                  className={cn(appTextareaClass, "mt-2 min-h-[88px]")}
                />
              </FormField>
              <button
                onClick={handleSave}
                disabled={!title.trim() || isSaving}
                className={cn(appPrimaryButtonClass, "flex w-full items-center justify-center")}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("saveChanges")}
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-surface px-4 py-3">
              <p className="text-[13px] leading-relaxed text-ink">
                {task.description || <span className="italic text-gray-400">{t("noAdditionalNotes")}</span>}
              </p>
              {!isEmployer && isActive && (
                <p className="mt-2 text-[11px] text-gray-400">{t("employerOnlyEdit")}</p>
              )}
            </div>
          )}
        </div>

        {/* Activity log — derived from stored fields */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">{t("activity")}</p>
          <ul className="space-y-3">
            <ActivityRow icon={<Plus className="h-3.5 w-3.5" />} tone="neutral" when={fmtDateTime(task.createdAt)} label={t("taskCreated")} by={roleOf(task.createdById, employerId, workerId, roleLabels)} />
            {task.isCompleted && (
              <ActivityRow icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="green" when={fmtDateTime(task.completedAt)} label={t("markedComplete")} by={roleOf(task.completedById, employerId, workerId, roleLabels)} />
            )}
            {task.isCanceled && (
              <ActivityRow icon={<Ban className="h-3.5 w-3.5" />} tone="red" when={fmtDateTime(task.canceledAt)} label={t("taskCanceled")} by={roleOf(task.canceledById, employerId, workerId, roleLabels)} />
            )}
          </ul>
        </div>
      </div>

      {jobEditable && (
        <SheetFooter>
          <button
            onClick={handleCancelToggle}
            disabled={isActing !== null}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-bold transition-colors disabled:opacity-50",
              task.isCanceled
                ? "border-brand/30 bg-white text-brand hover:bg-surface"
                : "border-red-200 bg-white text-red-600 hover:bg-red-50",
            )}
          >
            {isActing === "cancel" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : task.isCanceled ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            {task.isCanceled ? t("restoreTask") : t("cancelTask")}
          </button>
          <p className="mt-3 text-center text-[11px] text-gray-500">
            {task.isCanceled ? t("restoreHint") : t("cancelHint")}
          </p>
        </SheetFooter>
      )}
    </div>
  );
}

function ActivityRow({ icon, tone, label, by, when }: { icon: React.ReactNode; tone: "neutral" | "green" | "red"; label: string; by: string; when: string }) {
  const t = useTranslations("taskDrawer");
  const toneClass =
    tone === "green" ? "bg-brand/10 text-brand" : tone === "red" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500";
  return (
    <li className="flex items-start gap-3">
      <span className={cn("mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full", toneClass)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        <p className="text-[11px] text-gray-500">{t("byPrefix", { name: by })}{when ? ` · ${when}` : ""}</p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Add task
// ---------------------------------------------------------------------------

interface AddTaskViewProps {
  bookingId: string;
  onBack: () => void;
  onClose: () => void;
  onTaskAdded: (task: Task) => void;
}

function AddTaskView({ bookingId, onBack, onClose, onTaskAdded }: AddTaskViewProps) {
  const t = useTranslations("taskDrawer");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async () => {
    if (!title.trim() || isAdding) return;
    setIsAdding(true);
    try {
      const res = await api.post<{ data: Task }>(`/bookings/${bookingId}/tasks`, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onTaskAdded(res.data.data);
      setTitle("");
      setDescription("");
      onBack();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("failedToAddTask")));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader
        title={t("addTaskTitle")}
        onClose={onClose}
        leading={
          <button onClick={onBack} className="rounded-full p-1.5 text-ink transition-colors hover:bg-gray-100" aria-label={t("backToTasks")}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />
      <SheetBody>
        <FormField label={t("taskTitleFieldLabel")}>
          <input
            autoFocus
            type="text"
            maxLength={80}
            placeholder={t("taskTitlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
            className={cn(appInputClass, "mt-3")}
          />
          <p className="mt-2 text-right text-[11px] text-gray-400">{title.trim().length}/80</p>
        </FormField>
        <FormField label={t("detailsFieldLabel")} hint={t("optional")} className="mt-5">
          <textarea
            maxLength={200}
            placeholder={t("detailsPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(appTextareaClass, "mt-3 min-h-[120px]")}
          />
          <p className="mt-2 text-right text-[11px] text-gray-400">{description.trim().length}/200</p>
        </FormField>
      </SheetBody>
      <SheetFooter>
        <AppButton onClick={handleAddTask} disabled={!title.trim() || isAdding} className="flex w-full items-center justify-center">
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("addTask")}
        </AppButton>
        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <LockKeyhole className="h-3.5 w-3.5" />
          {t("visibleToBoth")}
        </p>
      </SheetFooter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main drawer
// ---------------------------------------------------------------------------

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  userId: string;
  employerId: string;
  workerId: string;
  status: string;
  isApproved?: boolean;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onStatusChange?: (status: string) => void;
}

export function TaskDrawer({
  isOpen,
  onClose,
  bookingId,
  userId,
  employerId,
  workerId,
  status,
  isApproved = false,
  tasks,
  onTasksChange,
  onStatusChange,
}: TaskDrawerProps) {
  const t = useTranslations("taskDrawer");
  const roleLabels = { employer: t("roleEmployer"), worker: t("roleWorker"), someone: t("roleSomeone") };
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const isEmployer = userId === employerId;
  const isReadOnly = status === BOOKING_STATUS.COMPLETED || status === BOOKING_STATUS.CANCELLED;
  const jobEditable = isApproved && !isReadOnly;

  const sorted = [...tasks].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.createdAt < b.createdAt ? -1 : 1));
  const todo = sorted.filter((t) => !t.isCompleted && !t.isCanceled);
  const done = sorted.filter((t) => t.isCompleted || t.isCanceled);
  const activeCount = todo.length;

  const handleClose = () => {
    setSelectedTask(null);
    setIsAddingTask(false);
    onClose();
  };

  // Stable keys for isActionLoading comparisons; translated only when displayed.
  const actionLabels = { completeJob: t("markJobComplete"), cancelJob: t("cancelJob") } as const;

  const handleStatusChange = async (newStatus: string, actionKey: keyof typeof actionLabels) => {
    if (isActionLoading) return;
    setIsActionLoading(actionKey);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(t("bookingUpdated", { status: newStatus.toLowerCase() }));
      onStatusChange?.(newStatus);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("failedAction", { action: actionLabels[actionKey].toLowerCase() })));
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleCompleteJob = () => {
    if (activeCount > 0) {
      toast.error(t("remainingTasksWarning", { count: activeCount }));
      return;
    }
    handleStatusChange(BOOKING_STATUS.COMPLETED, "completeJob");
  };

  const handleCancelJob = () => {
    if (confirm(t("confirmCancelJob"))) {
      handleStatusChange(BOOKING_STATUS.CANCELLED, "cancelJob");
    }
  };

  const patchTask = async (task: Task, body: Record<string, unknown>, errMsg: string) => {
    if (!jobEditable || togglingId) return;
    setTogglingId(task.id);
    try {
      const res = await api.patch<{ data: Task }>(`/bookings/${bookingId}/tasks/${task.id}`, body);
      onTasksChange(tasks.map((t) => (t.id === task.id ? res.data.data : t)));
    } catch (error) {
      toast.error(getApiErrorMessage(error, errMsg));
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleComplete = (task: Task) => patchTask(task, { isCompleted: !task.isCompleted }, t("failedToUpdateTask"));
  const handleToggleCancel = (task: Task) => patchTask(task, { isCanceled: !task.isCanceled }, t("failedToUpdateTask"));

  const handleTaskAdded = (task: Task) => {
    onTasksChange(tasks.some((t) => t.id === task.id) ? tasks : [...tasks, task]);
  };

  const handleTaskUpdate = (updated: Task) => {
    onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  // --- Manual reorder (To-Do only) via native HTML5 drag-and-drop ---
  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...todo];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);

    // Persist the whole order (reordered To-Do first, then Completed & Canceled).
    const orderedIds = [...next, ...done].map((t) => t.id);
    // Optimistic local order
    onTasksChange(orderedIds.map((id, i) => ({ ...tasks.find((t) => t.id === id)!, sortOrder: i })));
    try {
      const res = await api.patch<{ data: Task[] }>(`/bookings/${bookingId}/tasks/reorder`, { orderedIds });
      onTasksChange(res.data.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("failedToReorderTasks")));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <SheetOverlay zIndexClassName="z-30" className="bg-black/30 backdrop-blur-0" onClick={handleClose} aria-hidden="true" />

      <SheetPanel side="right" zIndexClassName="z-40" onClose={handleClose}>
        {isAddingTask ? (
          <AddTaskView bookingId={bookingId} onBack={() => setIsAddingTask(false)} onClose={handleClose} onTaskAdded={handleTaskAdded} />
        ) : selectedTask ? (
          <TaskDetailView
            task={tasks.find((t) => t.id === selectedTask.id) ?? selectedTask}
            employerId={employerId}
            workerId={workerId}
            isEmployer={isEmployer}
            jobEditable={jobEditable}
            onBack={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
          />
        ) : (
          <>
            <SheetHeader title={t("tasksTitle")} onClose={handleClose} />

            {/* Provenance / read-only banner */}
            {isReadOnly ? (
              <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 text-gray-600">
                <LockKeyhole className="h-5 w-5 flex-shrink-0" />
                <p className="text-[12px] font-medium">{t("readOnlyNotice", { status: status.toLowerCase() })}</p>
              </div>
            ) : (
              <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-brand">
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-bold">{t("remaining", { count: activeCount })}</p>
                  <p className="mt-0.5 text-[11px] text-current/70">{t("neverDeletedNotice")}</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {/* TO DO */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{t("todoSection", { count: activeCount })}</p>
                  {jobEditable && activeCount > 1 && (
                    <span className="text-[10px] font-medium text-gray-400">{t("dragToReorder")}</span>
                  )}
                </div>

                {todo.length === 0 ? (
                  <div className={cn(appCardClass, "flex flex-col items-center justify-center px-4 py-7 text-center")}>
                    <CheckCircle2 className="h-10 w-10 text-brand" strokeWidth={1.8} />
                    <p className="mt-3 text-[13px] font-bold text-ink">{t("noPendingTasks")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todo.map((task, index) => (
                      <div
                        key={task.id}
                        draggable={jobEditable}
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(index)}
                        className={cn(
                          "flex items-center gap-2 rounded-2xl border border-[#DCE8D9] bg-white px-3 py-3 shadow-sm transition-colors",
                          dragIndex === index && "opacity-50",
                        )}
                      >
                        {jobEditable && (
                          <span className="flex-shrink-0 cursor-grab text-gray-300 active:cursor-grabbing" aria-hidden>
                            <GripVertical className="h-4 w-4" />
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleComplete(task)}
                          disabled={!jobEditable || togglingId === task.id}
                          className="flex-shrink-0 disabled:opacity-50"
                          aria-label={t("markComplete")}
                        >
                          {togglingId === task.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-brand" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                        <button onClick={() => setSelectedTask(task)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[13px] font-medium leading-snug text-ink">{task.title}</span>
                          <span className="text-[10px] text-gray-400">{t("addedBy", { role: roleOf(task.createdById, employerId, workerId, roleLabels) })}</span>
                        </button>
                        {isEmployer && jobEditable && (
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                            aria-label={t("editTask")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                          aria-label={t("viewTaskDetails")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {jobEditable && (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="mt-4 flex items-center gap-2 px-1 text-[13px] font-bold text-brand transition-colors hover:text-brand-dark"
                  >
                    <Plus className="h-4 w-4" />
                    {t("addTask")}
                  </button>
                )}
              </section>

              {/* COMPLETED & CANCELED */}
              <section className="mt-6 border-t border-gray-100 pt-4">
                <button onClick={() => setShowDone((v) => !v)} className="flex w-full items-center justify-between text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{t("completedCanceledSection", { count: done.length })}</span>
                  <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", showDone && "rotate-180")} />
                </button>

                {showDone && (
                  <div className="mt-3 space-y-2">
                    {done.length === 0 ? (
                      <p className="text-[12px] text-gray-500">{t("nothingHereYet")}</p>
                    ) : (
                      done.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 rounded-2xl border border-[#DCE8D9] bg-white px-3 py-3 shadow-sm">
                          <button
                            onClick={() => (task.isCanceled ? handleToggleCancel(task) : handleToggleComplete(task))}
                            disabled={!jobEditable || togglingId === task.id}
                            className="flex-shrink-0 disabled:opacity-50"
                            aria-label={task.isCanceled ? t("restoreTaskAria") : t("markIncomplete")}
                          >
                            {togglingId === task.id ? (
                              <Loader2 className="h-5 w-5 animate-spin text-brand" />
                            ) : task.isCanceled ? (
                              <Ban className="h-5 w-5 text-red-400" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-brand" />
                            )}
                          </button>
                          <button onClick={() => setSelectedTask(task)} className="min-w-0 flex-1 text-left">
                            <span className={cn("block truncate text-[13px] font-medium leading-snug text-gray-500", task.isCanceled && "line-through")}>{task.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {task.isCanceled
                                ? t("canceledByPrefix", { name: roleOf(task.canceledById, employerId, workerId, roleLabels) })
                                : t("completedByPrefix", { name: roleOf(task.completedById, employerId, workerId, roleLabels) })}
                            </span>
                          </button>
                          {task.isCanceled && (
                            <span className="flex-shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">{t("canceledBadge")}</span>
                          )}
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                            aria-label={t("viewTaskDetails")}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Job actions */}
            {!isReadOnly && (
              <div className="border-t border-[#EDF1EC] px-5 pb-6 pt-4">
                <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("jobActions")}</p>
                <div className="space-y-2">
                  <button
                    onClick={handleCompleteJob}
                    disabled={!!isActionLoading}
                    className="flex w-full items-center gap-3 rounded-xl border border-brand/20 bg-brand px-4 py-3 text-left text-white shadow-sm disabled:opacity-50"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/80">
                      {isActionLoading === "completeJob" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold">{t("markJobComplete")}</p>
                      <p className="text-[10px] text-white/80">{activeCount > 0 ? t("finishRemainingFirst") : t("allTasksResolved")}</p>
                    </div>
                  </button>

                  <button onClick={() => setIsReportModalOpen(true)} className={cn(appSecondaryButtonClass, "h-auto justify-start gap-3 py-3 text-left")}>
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <ShieldAlert className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-ink">{t("reportIssue")}</p>
                      <p className="text-[10px] text-gray-400">{t("reportIssueHint")}</p>
                    </div>
                  </button>

                  <button onClick={handleCancelJob} disabled={!!isActionLoading} className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-left disabled:opacity-50">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                      {isActionLoading === "cancelJob" ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <X className="h-4 w-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-red-600">{t("cancelJob")}</p>
                      <p className="text-[10px] text-red-500/70">{t("cancelJobHint")}</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetPanel>
      {isReportModalOpen && (
        <ReportModal targetId={userId === employerId ? workerId : employerId} onClose={() => setIsReportModalOpen(false)} />
      )}
    </>
  );
}
