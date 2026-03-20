"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

type TasksResponse = {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiErrorResponse = {
  message?: string;
};

type StatusFilter = "all" | "completed" | "pending";

export default function DashboardPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }, []);

  const buildTasksUrl = (): string => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    return `/api/tasks?${params.toString()}`;
  };

  const handleUnauthorized = (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const fetchTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        router.push("/login");
        return;
      }

      const res = await fetch(buildTasksUrl(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: TasksResponse | ApiErrorResponse = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        const message =
          "message" in data ? data.message : "Failed to fetch tasks.";
        setError(message || "Failed to fetch tasks.");
        return;
      }

      if ("tasks" in data) {
        setTasks(data.tasks);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("FETCH_TASKS_ERROR", err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchTasks();
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleCreateTask = async (): Promise<void> => {
    if (!title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    try {
      setCreating(true);

      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data: { message?: string } = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Failed to create task.");
        return;
      }

      setTitle("");
      setDescription("");
      setPage(1);
      toast.success("Task created successfully.");
      await fetchTasks();
    } catch (err) {
      console.error("CREATE_TASK_ERROR", err);
      toast.error("Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (taskId: string): Promise<void> => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: { message?: string } = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Failed to toggle task.");
        return;
      }

      toast.success("Task status updated.");
      await fetchTasks();
    } catch (err) {
      console.error("TOGGLE_TASK_ERROR", err);
      toast.error("Failed to toggle task.");
    }
  };

  const handleDelete = async (taskId: string): Promise<void> => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: { message?: string } = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Failed to delete task.");
        return;
      }

      toast.success("Task deleted successfully.");

      if (tasks.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchTasks();
      }
    } catch (err) {
      console.error("DELETE_TASK_ERROR", err);
      toast.error("Failed to delete task.");
    }
  };

  const startEditing = (task: Task): void => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
  };

  const cancelEditing = (): void => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = async (taskId: string): Promise<void> => {
    if (!editTitle.trim()) {
      toast.error("Task title is required.");
      return;
    }

    try {
      setSavingEdit(true);

      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });

      const data: { message?: string } = await res.json();

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Failed to update task.");
        return;
      }

      toast.success("Task updated successfully.");
      cancelEditing();
      await fetchTasks();
    } catch (err) {
      console.error("EDIT_TASK_ERROR", err);
      toast.error("Failed to update task.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (err) {
      console.error("LOGOUT_ERROR", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Task Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your tasks efficiently.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Your Tasks</h2>

          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-slate-500"
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-slate-500"
            />

            <button
              onClick={handleCreateTask}
              disabled={creating}
              className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Adding..." : "Add Task"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Search by title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-slate-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading tasks...</p>
          ) : error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-slate-400">No tasks found.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  {editingTaskId === task.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-slate-500"
                      />

                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-slate-500"
                      />

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          disabled={savingEdit}
                          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200 disabled:opacity-60"
                        >
                          {savingEdit ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={cancelEditing}
                          className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-base font-semibold ${
                            task.completed ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {task.title}
                        </h3>

                        <p className="mt-1 break-words text-sm text-slate-400">
                          {task.description || "No description provided."}
                        </p>

                        <p className="mt-2 text-xs">
                          {task.completed ? "✅ Completed" : "⏳ Pending"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggle(task.id)}
                          className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
                        >
                          {task.completed ? "Undo" : "Complete"}
                        </button>

                        <button
                          onClick={() => startEditing(task)}
                          className="rounded-lg border border-blue-500/40 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(task.id)}
                          className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}