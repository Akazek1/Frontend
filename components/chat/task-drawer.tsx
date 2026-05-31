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
  isInProgress: boolean;
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

function TaskDetailView({ task, userId, employerId, isInProgress, onBack, onUpdate, onDelete }: TaskDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const canDelete = task.createdById === userId || employerId === userId;
  const canEdit = isInProgress;

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("Tasks can only be edited while the job is in progress.");
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
    if (!isInProgress) {
      toast.error("Tasks can only be deleted while the job is in progress.");
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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <button onClick={onBack} className="text-[#145B10] text-[13px] font-semibold">
          ← Back
        </button>
        <h3 className="flex-1 text-[15px] font-bold text-[#1B2431] truncate">Task Detail</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border-2 ${task.isCompleted ? "border-[#145B10] bg-[#145B10]" : "border-gray-300"} flex items-center justify-center`}>
            {task.isCompleted && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
          <div>
            <p className={`text-[15px] font-semibold ${task.isCompleted ? "line-through text-gray-400" : "text-[#1B2431]"}`}>
              {task.title}
            </p>
            {task.isCompleted && task.completedAt && (
              <p className="text-[11px] text-[#145B10] mt-0.5">
                Completed {new Date(task.completedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        {task.description && (
          <div className="rounded-xl bg-[#F1FCEF] px-4 py-3">
            <p className="text-[12px] font-semibold text-[#145B10] mb-1">Notes</p>
            <p className="text-[13px] text-[#1B2431] leading-relaxed">{task.description}</p>
          </div>
        )}

        {!task.description && (
          <p className="text-[12px] text-gray-400 italic">No additional notes.</p>
        )}

        <p className="text-[11px] text-gray-400">
          Added {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </p>

        <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Task title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-[13px] text-[#1B2431] outline-none transition focus:border-[#145B10]/40 focus:ring-2 focus:ring-[#145B10]/10 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder="No additional notes."
              className="mt-2 min-h-[88px] w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-[13px] leading-relaxed text-[#1B2431] outline-none transition focus:border-[#145B10]/40 focus:ring-2 focus:ring-[#145B10]/10 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {!canEdit && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
              Tasks can only be edited while the job is in progress.
            </p>
          )}

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={!title.trim() || isSaving}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-[#145B10] text-[13px] font-bold text-white transition-colors hover:bg-[#0F4D0C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Task"}
            </button>
          )}
        </div>
      </div>

      {canDelete && (
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Task
          </button>
        </div>
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
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-[#1B2431] transition-colors hover:bg-gray-100"
          aria-label="Back to tasks"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-[16px] font-bold text-[#1B2431]">Add Task</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
          Task Title
        </label>
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
          className="mt-3 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-[#1B2431] outline-none transition focus:border-[#145B10]/40 focus:ring-2 focus:ring-[#145B10]/10"
        />
        <p className="mt-2 text-right text-[11px] text-gray-400">{titleLength}/80</p>

        <label className="mt-5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
          Details (Optional)
        </label>
        <textarea
          maxLength={200}
          placeholder="Add notes or instructions..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-3 min-h-[96px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] leading-relaxed text-[#1B2431] outline-none transition focus:border-[#145B10]/40 focus:ring-2 focus:ring-[#145B10]/10"
        />
        <p className="mt-2 text-right text-[11px] text-gray-400">{descriptionLength}/200</p>
      </div>

      <div className="px-6 pb-6 pt-4">
        <button
          onClick={handleAddTask}
          disabled={!title.trim() || isAdding}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-[#145B10] text-[14px] font-bold text-white transition-colors hover:bg-[#0F4D0C] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Task"}
        </button>
        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <LockKeyhole className="h-3.5 w-3.5" />
          Task will be visible to the worker
        </p>
      </div>
    </div>
  );
}

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  userId: string;
  employerId: string;
  isInProgress: boolean;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export function TaskDrawer({
  isOpen,
  onClose,
  bookingId,
  userId,
  employerId,
  isInProgress,
  tasks,
  onTasksChange,
}: TaskDrawerProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  const incompleteTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const incompleteCount = incompleteTasks.length;
  const canEditTasks = isInProgress;

  const handleClose = () => {
    setSelectedTask(null);
    setIsAddingTask(false);
    onClose();
  };

  const handleToggle = async (task: Task) => {
    if (!isInProgress) {
      toast.error("Tasks can only be edited while the job is in progress.");
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30 animate-in fade-in duration-150"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer — slides in from the right */}
      <div
        className="fixed top-0 right-0 bottom-0 z-40 flex w-[88%] max-w-[380px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200"
        style={{ borderRadius: "16px 0 0 16px" }}
      >
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
            isInProgress={isInProgress}
            onBack={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#1B2431]">Tasks</h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status card */}
            <div
              className={`mx-5 mb-5 flex items-center gap-3 rounded-xl px-4 py-3 ${
                incompleteCount > 0 ? "bg-orange-50 text-orange-700" : "bg-[#F1FCEF] text-[#145B10]"
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
                  <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-4 py-7 text-center shadow-sm">
                    <CheckCircle2 className="h-10 w-10 text-[#145B10]" strokeWidth={1.8} />
                    <p className="mt-3 text-[13px] font-bold text-[#1B2431]">No pending tasks</p>
                    <p className="mt-1 text-[11px] text-gray-500">Enjoy the rest of your day!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incompleteTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggle(task)}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm transition-colors hover:bg-gray-50"
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
                            <Loader2 className="h-5 w-5 animate-spin text-[#145B10]" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                        <span className="flex-1 text-[13px] font-medium leading-snug text-[#1B2431]">
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
                    className="mt-4 flex items-center gap-2 px-1 text-[13px] font-bold text-[#145B10] transition-colors hover:text-[#0F4D0C]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </button>
                ) : (
                  <p className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                    Tasks can only be edited while the job is in progress.
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
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm transition-colors hover:bg-gray-50"
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
                              <Loader2 className="h-5 w-5 animate-spin text-[#145B10]" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-[#145B10]" />
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
            <div className="border-t border-gray-100 px-5 pb-6 pt-4">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Job Actions
              </p>
              <div className="space-y-2">
                <button className="flex w-full items-center gap-3 rounded-xl border border-[#145B10]/20 bg-[#145B10] px-4 py-3 text-left text-white shadow-sm">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/80">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">Complete Job</p>
                    <p className="text-[10px] text-white/80">All tasks done? Mark this job complete.</p>
                  </div>
                </button>

                <button className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <ShieldAlert className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1B2431]">Report Issue</p>
                    <p className="text-[10px] text-gray-400">Something not right? Let us know.</p>
                  </div>
                </button>

                <button className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                    <X className="h-4 w-4 text-red-500" />
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
      </div>
    </>
  );
}
