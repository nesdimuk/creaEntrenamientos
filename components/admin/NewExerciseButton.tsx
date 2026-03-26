'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle } from 'lucide-react'

const CATEGORIES = [
  { value: 'push', label: 'Empuje' }, { value: 'pull', label: 'Jalón' },
  { value: 'legs', label: 'Piernas' }, { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' }, { value: 'mobility', label: 'Movilidad' },
  { value: 'other', label: 'Otro' },
]

export default function NewExerciseButton({ trainerId }: { trainerId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', category: '', muscle_group: '', description: '', video_url: ''
  })

  function set(key: string, val: string) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true); setError('')

    const { error: err } = await supabase.from('exercises').insert({
      trainer_id: trainerId,
      name: form.name,
      category: form.category || null,
      muscle_group: form.muscle_group || null,
      description: form.description || null,
      video_url: form.video_url || null,
      is_global: false,
    })

    if (err) { setError(err.message); setLoading(false); return }
    setOpen(false)
    setForm({ name: '', category: '', muscle_group: '', description: '', video_url: '' })
    router.refresh(); setLoading(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusCircle className="w-4 h-4 mr-1.5" />Nuevo ejercicio
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo ejercicio</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input placeholder="Press de banca" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Grupo muscular</Label>
                <Input placeholder="Pecho, tríceps" value={form.muscle_group} onChange={e => set('muscle_group', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Video URL (YouTube)</Label>
              <Input placeholder="https://youtube.com/watch?v=..." value={form.video_url} onChange={e => set('video_url', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción / instrucciones</Label>
              <Textarea placeholder="Cómo ejecutar el ejercicio..." value={form.description}
                onChange={e => set('description', e.target.value)} rows={3} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
