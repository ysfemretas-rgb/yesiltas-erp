import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  status: "pending" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  dueDate: string
  createdAt: string
}

function fromRow(row: any): Task {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    assignedTo: row.assigned_to ?? "",
    status: (row.status as Task["status"]) ?? "pending",
    priority: (row.priority as Task["priority"]) ?? "medium",
    dueDate: row.due_date ?? "",
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : "",
  }
}

function toRow(t: Partial<Task>) {
  const row: Record<string, unknown> = {}
  if (t.title !== undefined) row.title = t.title
  if (t.description !== undefined) row.description = t.description
  if (t.assignedTo !== undefined) row.assigned_to = t.assignedTo
  if (t.status !== undefined) row.status = t.status
  if (t.priority !== undefined) row.priority = t.priority
  if (t.dueDate !== undefined) row.due_date = t.dueDate || null
  return row
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(1000)
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function createTask(input: Omit<Task, "id" | "createdAt">): Promise<Task> {
  const { data, error } = await supabase.from("tasks").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Görevler", "created", `${created.title} eklendi`)
  return created
}

export async function updateTask(id: string, input: Partial<Omit<Task, "id" | "createdAt">>): Promise<Task> {
  const { data, error } = await supabase.from("tasks").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Görevler", "updated", `${updated.title} güncellendi`)
  return updated
}

export async function deleteTask(id: string): Promise<void> {
  const { data: existing } = await supabase.from("tasks").select("title").eq("id", id).single()
  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) throw error
  logActivity("Görevler", "deleted", `${existing?.title || "Bir görev"} silindi`)
}
