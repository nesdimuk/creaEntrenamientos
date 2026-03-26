'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/lib/button-variants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProgramPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', duration_weeks: '4', goal: '', difficulty: ''
  })

  function set(key: string, val: string) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('El título es obligatorio'); return }
    setLoading(true); setError('')

    const { data: trainer } = await supabase.from('trainer_profile').select('id').single()
    if (!trainer) { setError('Perfil no encontrado'); setLoading(false); return }

    const { data: program, error: err } = await supabase
      .from('programs')
      .insert({
        trainer_id: trainer.id,
        title: form.title,
        description: form.description || null,
        duration_weeks: parseInt(form.duration_weeks) || 4,
        goal: form.goal || null,
        difficulty: form.difficulty || null,
      })
      .select('id')
      .single()

    if (err || !program) { setError(err?.message ?? 'Error'); setLoading(false); return }
    router.push(`/programas/${program.id}/edit`)
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/programas" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Nuevo programa</h1>
          <p className="text-sm text-zinc-500">Define los datos generales del programa</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ej: Programa de fuerza 12 semanas" value={form.title}
                onChange={e => set('title', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea placeholder="Objetivos, descripción general..." value={form.description}
                onChange={e => set('description', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Semanas</Label>
                <Input type="number" min="1" max="52" value={form.duration_weeks}
                  onChange={e => set('duration_weeks', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Objetivo</Label>
                <Select value={form.goal} onValueChange={v => set('goal', v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Fuerza</SelectItem>
                    <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                    <SelectItem value="fat_loss">Pérdida de grasa</SelectItem>
                    <SelectItem value="endurance">Resistencia</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nivel</Label>
                <Select value={form.difficulty} onValueChange={v => set('difficulty', v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Link href="/programas" className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 justify-center')}>
                Cancelar
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creando...' : 'Crear y agregar sesiones →'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
