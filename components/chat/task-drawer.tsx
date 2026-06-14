"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  Loader2,
  LockKeyhole,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
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
  appDangerButtonClass,
  appFieldLabelClass,
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
  createdAt: string;
}

interface TaskDetailViewProps {
  task: Task;
  userId: string;
  employerId: string;
  isApproved: boolean;
  onBack: () => void;
  onUpdate: (updated: Task) => void;
  onDelete: (taskId: string) => void;
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

function TaskDetailView({ task, userId, employerId, isApproved, onBack, onUpdate, onDelete }: TaskDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const canDelete = task.createdById === userId || employerId === userId;
  const canEdit = isApproved;

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("Tasks can only be edited if work is approved.");
      return;
    }

    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await api.patch<{ data: Task }>(`/bookings/${task.bookingId}/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim(),
      });
      onUpdate(res.data.data);
      toast.success("Task updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update task"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isApproved) {
      toast.error("Tasks can only be deleted if work is approved.");
      return;
    }

    if (!canDelete) {
      toast.error("Only the task creator or employer can delete this task.");
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/bookings/${task.bookingId}/tasks/${task.id}`);
      onDelete(task.id);
      onBack();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete task"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader
        title="Task Detail"
        leading={
          <button onClick={onBack} className="text-brand text-[13px] font-semibold">
            ← Back
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border-2 ${task.isCompleted ? "border-brand bg-brand" : "border-gray-300"} flex items-center justify-center`}>
            {task.isCompleted && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
          <div>
            <p className={`text-[15px] font-semibold ${task.isCompleted ? "line-through text-gray-400" : "text-ink"}`}>
              {task.title}
            </p>
            {task.isCompleted && task.completedAt && (
              <p className="text-[11px] text-brand mt-0.5">
                Completed {new Date(task.completedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        {task.description && (
          <div className="rounded-xl bg-surface px-4 py-3">
            <p className="text-[12px] font-semibold text-brand mb-1">Notes</p>
            <p className="text-[13px] text-ink leading-relaxed">{task.description}</p>
          </div>
        )}

        {!task.description && (
          <p className="text-[12px] text-gray-400 italic">No additional notes.</p>
        )}

        <p className="text-[11px] text-gray-400">
          Added {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </p>

        <div className={cn(appCardClass, "space-y-3")}>
          <div>
            <label className={appFieldLabelClass}>
              Task title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              className={cn(appInputClass, "mt-2 disabled:bg-gray-50 disabled:text-gray-500")}
            />
          </div>

          <div>
            <label className={appFieldLabelClass}>
              Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder="No additional notes."
              className={cn(appTextareaClass, "mt-2 min-h-[88px] disabled:bg-gray-50 disabled:text-gray-500")}
            />
          </div>

          {!canEdit && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
              Tasks can only be edited if work is approved.
            </p>
          )}

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={!title.trim() || isSaving}
              className={cn(appPrimaryButtonClass, "w-full")}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Task"}
            </button>
          )}
        </div>
      </div>

      {canDelete && (
        <SheetFooter>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(appDangerButtonClass, "flex w-full items-center justify-center gap-2")}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Task
          </button>
        </SheetFooter>
      )}
    </div>
  );
}

interface AddTaskViewProps {
  bookingId: string;
  onBack: () => void;
  onClose: () => void;
  onTaskAdded: (task: Task) => void;
}

function AddTaskView({ bookingId, onBack, onClose, onTaskAdded }: AddTaskViewProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const titleLength = title.trim().length;
  const descriptionLength = description.trim().length;

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
      toast.error(getApiErrorMessage(error, "Failed to add task"));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader
        title="Add Task"
        onClose={onClose}
        leading={
          <button
            onClick={onBack}
            className="rounded-full p-1.5 text-ink transition-colors hover:bg-gray-100"
            aria-label="Back to tasks"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      <SheetBody>
        <FormField label="Task Title">
        <input
          autoFocus
          type="text"
          maxLength={80}
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTask();
          }}
          className={cn(appInputClass, "mt-3")}
        />
        <p className="mt-2 text-right text-[11px] text-gray-400">{titleLength}/80</p>
        </FormField>

        <FormField label="Details" hint="Optional" className="mt-5">
        <textarea
          maxLength={200}
          placeholder="Add notes or instructions..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={cn(appTextareaClass, "mt-3 min-h-[120px]")}
        />
        <p className="mt-2 text-right text-[11px] text-gray-400">{descriptionLength}/200</p>
        </FormField>
      </SheetBody>

      <SheetFooter>
        <AppButton
          onClick={handleAddTask}
          disabled={!title.trim() || isAdding}
          className="flex w-full items-center justify-center"
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Task"}
        </AppButton>
        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <LockKeyhole className="h-3.5 w-3.5" />
          Task will be visible to the worker
        </p>
      </SheetFooter>
    </div>
  );
}

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  userId: string;
  employerId: string;
  workerId: string;
  isInProgress: boolean;
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
  isInProgress,
  isApproved = false,
  tasks,
  onTasksChange,
  onStatusChange,
}: TaskDrawerProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const incompleteTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const incompleteCount = incompleteTasks.length;
  const canEditTasks = isApproved || isInProgress;

  const handleClose = () => {
    setSelectedTask(null);
    setIsAddingTask(false);
    onClose();
  };

  const handleStatusChange = async (newStatus: string, actionName: string) => {
    if (isActionLoading) return;
    setIsActionLoading(actionName);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Booking ${newStatus.toLowerCase()} successfully`);
      onStatusChange?.(newStatus);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to ${actionName.toLowerCase()}`));
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleCompleteJob = () => {
    if (incompleteCount > 0) {
      toast.error(`Please complete all ${incompleteCount} tasks before finishing.`);
      return;
    }
    handleStatusChange(BOOKING_STATUS.COMPLETED, "Complete Job");
  };

  const handleCancelJob = () => {
    if (confirm("Are you sure you want to cancel this job? This action cannot be undone.")) {
      handleStatusChange(BOOKING_STATUS.CANCELLED, "Cancel Job");
    }
  };

  const handleToggle = async (task: Task) => {
    if (!isApproved && !isInProgress) {
      toast.error("Tasks can only be edited if work is approved.");
      return;
    }

    if (togglingId) return;

    setTogglingId(task.id);
    try {
      const updated = await api.patch<{ data: Task }>(`/bookings/${bookingId}/tasks/${task.id}`, {
        isCompleted: !task.isCompleted,
      });
      onTasksChange(tasks.map((t) => (t.id === task.id ? updated.data.data : t)));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update task"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleTaskAdded = (task: Task) => {
    onTasksChange(tasks.some((t) => t.id === task.id) ? tasks : [...tasks, task]);
  };

  const handleTaskUpdate = (updated: Task) => {
    onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleTaskDelete = (taskId: string) => {
    onTasksChange(tasks.filter((t) => t.id !== taskId));
  };

  if (!isOpen) return null;

  return (
    <>
      <SheetOverlay
        zIndexClassName="z-30"
        className="bg-black/30 backdrop-blur-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <SheetPanel side="right" zIndexClassName="z-40" onClose={handleClose}>
        {isAddingTask ? (
          <AddTaskView
            bookingId={bookingId}
            onBack={() => setIsAddingTask(false)}
            onClose={handleClose}
            onTaskAdded={handleTaskAdded}
          />
        ) : selectedTask ? (
          <TaskDetailView
            task={selectedTask}
            userId={userId}
            employerId={employerId}
            isApproved={canEditTasks}
            onBack={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />
        ) : (
          <>
            <SheetHeader title="Tasks" onClose={handleClose} />

            {/* Status card */}
            <div
              className={`mx-5 mb-5 flex items-center gap-3 rounded-xl px-4 py-3 ${
                incompleteCount > 0 ? "bg-orange-50 text-orange-700" : "bg-surface text-brand"
              }`}
            >
              <ClipboardList className="h-5 w-5 flex-shrink-0" strokeWidth={2.2} />
              <div>
                <p className="text-[12px] font-bold">
                  {incompleteCount > 0
                    ? `${incompleteCount} ${incompleteCount === 1 ? "task" : "tasks"} remaining`
                    : "All tasks completed"}
                </p>
                <p className="mt-0.5 text-[11px] text-current/70">
                  {incompleteCount > 0 ? "Keep going, you're doing great!" : "Great job!"}
                </p>
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <section>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Incomplete ({incompleteCount})
                </p>

                {incompleteTasks.length === 0 ? (
                  <div className={cn(appCardClass, "flex flex-col items-center justify-center px-4 py-7 text-center")}>
                    <CheckCircle2 className="h-10 w-10 text-brand" strokeWidth={1.8} />
                    <p className="mt-3 text-[13px] font-bold text-ink">No pending tasks</p>
                    <p className="mt-1 text-[11px] text-gray-500">Enjoy the rest of your day!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incompleteTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggle(task)}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#DCE8D9] bg-white px-3 py-3 shadow-sm transition-colors hover:bg-gray-50"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggle(task);
                          }
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(task);
                          }}
                          disabled={togglingId === task.id}
                          className="flex-shrink-0 disabled:opacity-50"
                          aria-label="Mark complete"
                        >
                          {togglingId === task.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-brand" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                        <span className="flex-1 text-[13px] font-medium leading-snug text-ink">
                          {task.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                          aria-label="View task details"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {canEditTasks ? (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="mt-4 flex items-center gap-2 px-1 text-[13px] font-bold text-brand transition-colors hover:text-brand-dark"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </button>
                ) : (
                  <p className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                    Tasks can only be edited if work is approved.
                  </p>
                )}
              </section>

              <section className="mt-6 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setShowCompletedTasks((value) => !value)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Completed ({completedTasks.length})
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      showCompletedTasks ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showCompletedTasks && (
                  <div className="mt-3 space-y-2">
                    {completedTasks.length === 0 ? (
                      <p className="text-[12px] text-gray-500">No completed tasks yet.</p>
                    ) : (
                      completedTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggle(task)}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#DCE8D9] bg-white px-3 py-3 shadow-sm transition-colors hover:bg-gray-50"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleToggle(task);
                            }
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(task);
                            }}
                            disabled={togglingId === task.id}
                            className="flex-shrink-0 disabled:opacity-50"
                            aria-label="Mark incomplete"
                          >
                            {togglingId === task.id ? (
                              <Loader2 className="h-5 w-5 animate-spin text-brand" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-brand" />
                            )}
                          </button>
                          <span className="flex-1 text-[13px] font-medium leading-snug text-gray-500 line-through">
                            {task.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                            aria-label="View task details"
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

            {/* Action buttons at bottom */}
            <div className="border-t border-[#EDF1EC] px-5 pb-6 pt-4">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Job Actions
              </p>
              <div className="space-y-2">
                <button 
                  onClick={handleCompleteJob}
                  disabled={!!isActionLoading}
                  className="flex w-full items-center gap-3 rounded-xl border border-brand/20 bg-brand px-4 py-3 text-left text-white shadow-sm disabled:opacity-50"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/80">
                    {isActionLoading === "Complete Job" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">Complete Job</p>
                    <p className="text-[10px] text-white/80">All tasks done? Mark this job complete.</p>
                  </div>
                </button>

                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className={cn(appSecondaryButtonClass, "h-auto justify-start gap-3 py-3 text-left")}
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <ShieldAlert className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink">Report Issue</p>
                    <p className="text-[10px] text-gray-400">Something not right? Let us know.</p>
                  </div>
                </button>

                <button 
                  onClick={handleCancelJob}
                  disabled={!!isActionLoading}
                  className={cn(appDangerButtonClass, "h-auto justify-start gap-3 py-3 text-left disabled:opacity-50")}
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                    {isActionLoading === "Cancel Job" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-red-600">Cancel Job</p>
                    <p className="text-[10px] text-red-500/70">Cancel this booking.</p>
                  </div>
                </button>
              </div>

              <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                <LockKeyhole className="h-3.5 w-3.5" />
                Your progress is saved automatically
              </p>
            </div>
          </>
        )}
      </SheetPanel>
      {isReportModalOpen && (
        <ReportModal 
          targetId={userId === employerId ? workerId : employerId}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </>
  );
}
