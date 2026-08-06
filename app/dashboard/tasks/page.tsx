"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ListChecks, User } from "lucide-react"
import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { Task, fetchTasks, createTask, updateTask, deleteTask } from "@/lib/tasks"
import { fetchStaff, StaffMember } from "@/lib/staff"

const PRIORITY_META: Record<Task["priority"], { label: string; className: string }> = {
  low: { label: "Düşük", className: "bg-slate-700 text-slate-300" },
  medium: { label: "Orta", className: "bg-amber-900/50 text-amber-300 border border-amber-700" },
  high: { label: "Yüksek", className: "bg-red-900/50 text-red-300 border border-red-700" },
}

const STATUS_META: Record<Task["status"], { label: string; className: string }> = {
  pending: { label: "⏳ Bekliyor", className: "bg-slate-700 text-slate-300" },
  in_progress: { label: "🔧 Devam Ediyor", className: "bg-blue-900/50 text-blue-300 border border-blue-700" },
  done: { label: "✅ Tamamlandı", className: "bg-emerald-900/50 text-emerald-300 border border-emerald-700" },
}

export default function TasksPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Görevler")
  const isManager = useIsManager()

  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({ priority: "medium", status: "pending" })

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchTasks(), fetchStaff()])
      .then(([t, s]) => {
        if (!cancelled) {
          setTasks(t)
          setStaff(s)
        }
      })
      .catch((e) => {
        console.error("Görevler yüklenemedi:", e)
        if (!cancelled) showToast("Görevler yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  const handleAddTask = async () => {
    if (!newTask.title?.trim()) {
      showToast("Lütfen görev başlığı girin!", "error")
      return
    }
    try {
      const task = await createTask({
        title: newTask.title.trim(),
        description: newTask.description || "",
        assignedTo: newTask.assignedTo || "",
        status: "pending",
        priority: newTask.priority || "medium",
        dueDate: newTask.dueDate || "",
      })
      setTasks([task, ...tasks])
      setNewTask({ priority: "medium", status: "pending" })
      setIsDialogOpen(false)
      showToast("Görev eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Görev eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    const prev = tasks
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)))
    try {
      await updateTask(id, { status })
    } catch (e) {
      console.error(e)
      setTasks(prev)
      showToast("Durum güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return
    try {
      await deleteTask(id)
      setTasks(tasks.filter((t) => t.id !== id))
      showToast("Görev silindi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Görev silinirken bir sorun oluştu.", "error")
    }
  }

  const filteredTasks = tasks.filter((t) => statusFilter === "all" || t.status === statusFilter)
  const pendingCount = tasks.filter((t) => t.status === "pending").length
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length
  const doneCount = tasks.filter((t) => t.status === "done").length

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetki kontrol ediliyor...</div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetkisiz erişim. Yönlendiriliyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-fuchsia-400" />
            Görevler
          </h1>
          <p className="text-sm text-slate-400 mt-1">Personele iş atayın, ilerlemeyi takip edin.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-fuchsia-600 hover:bg-fuchsia-700">
            <Plus className="h-4 w-4 mr-2" />Yeni Görev
          </Button>
          <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Görev</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Başlık <span className="text-red-400">*</span></Label>
                <Input
                  value={newTask.title || ""}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Örn: iPhone 14 ekran siparişi ver"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Açıklama</Label>
                <Textarea
                  value={newTask.description || ""}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Kime Atanacak</Label>
                  <Select value={newTask.assignedTo || ""} onValueChange={(v) => setNewTask({ ...newTask, assignedTo: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Personel seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.name} className="text-white">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Öncelik</Label>
                  <Select value={newTask.priority || "medium"} onValueChange={(v) => setNewTask({ ...newTask, priority: v as Task["priority"] })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="low" className="text-white">Düşük</SelectItem>
                      <SelectItem value="medium" className="text-white">Orta</SelectItem>
                      <SelectItem value="high" className="text-white">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Son Tarih</Label>
                <Input
                  type="date"
                  value={newTask.dueDate || ""}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleAddTask} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">
                <Plus className="h-4 w-4 mr-2" />Görevi Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs text-slate-400">⏳ Bekliyor</div>
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs text-slate-400">🔧 Devam Ediyor</div>
            <div className="text-2xl font-bold text-blue-400">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs text-slate-400">✅ Tamamlandı</div>
            <div className="text-2xl font-bold text-emerald-400">{doneCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "in_progress", "done"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? "bg-fuchsia-600 hover:bg-fuchsia-700" : "border-slate-600 text-slate-300"}
          >
            {s === "all" ? "Hepsi" : STATUS_META[s].label}
          </Button>
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Görev Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoaded ? (
            <p className="text-slate-500 text-center py-8">Yükleniyor...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Görev bulunamadı.</p>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div key={task.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-sm font-medium text-white">{task.title}</div>
                      {task.description && <div className="text-xs text-slate-400 mt-0.5">{task.description}</div>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={PRIORITY_META[task.priority].className}>{PRIORITY_META[task.priority].label}</Badge>
                        {task.assignedTo && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="h-3 w-3" />{task.assignedTo}
                          </span>
                        )}
                        {task.dueDate && <span className="text-xs text-slate-500">📅 {task.dueDate}</span>}
                      </div>
                    </div>
                    {isManager && (
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    )}
                  </div>
                  <div className="mt-2">
                    <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v as Task["status"])}>
                      <SelectTrigger className="h-8 w-[160px] bg-slate-900 border-slate-600 text-xs text-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="pending">⏳ Bekliyor</SelectItem>
                        <SelectItem value="in_progress">🔧 Devam Ediyor</SelectItem>
                        <SelectItem value="done">✅ Tamamlandı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
