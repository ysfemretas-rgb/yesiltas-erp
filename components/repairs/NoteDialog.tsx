"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface Note {
  id: number
  repairId: number
  text: string
  createdAt: string
  author: string
}

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName?: string
  notes: Note[]
  noteText: string
  onNoteTextChange: (text: string) => void
  onAddNote: () => void
}

export function NoteDialog({ open, onOpenChange, customerName, notes, noteText, onNoteTextChange, onAddNote }: NoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Notlar - {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Yeni Not Ekle</Label>
            <div className="flex gap-2">
              <Textarea
                value={noteText}
                onChange={(e) => onNoteTextChange(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white flex-1"
                placeholder="Not yazın..."
              />
              <Button onClick={onAddNote} className="bg-blue-600 hover:bg-blue-700 self-end">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <Label className="text-slate-300">Geçmiş Notlar</Label>
            {notes.length === 0 ? (
              <p className="text-slate-500 text-sm">Henüz not eklenmemiş.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <p className="text-white text-sm">{note.text}</p>
                  <p className="text-slate-500 text-xs mt-1">{note.author} - {note.createdAt}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
