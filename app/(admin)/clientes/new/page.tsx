'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', notes: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: trainer } = await supabase
      .from('trainer_profile').select('id').single()

    if (!trainer) { setError('Error: perfil de entrenador no encontrado'); setLoading(false); return }

    const { data: client, error: err } = await supabase
      .from('clients')
      .insert({ ...form, trainer_id: trainer.id })
      .select('id')
      .single()

    if (err || !client) { setError(err?.message ?? 'Error al crear alumno'); setLoading(false); return }

    // Send invite email
    await fetch('/api/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, clientId: client.id }),
    })

    router.push(`/clientes/${client.id}`)
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clientes" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Nuevo alumno</h1>
          <p className="text-sm text-zinc-500">Se enviará un email de invitación</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input id="full_name" name="full_name" value={form.full_name}
                onChange={handleChange} placeholder="Juan Pérez" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="alumno@email.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={form.phone}
                onChange={handleChange} placeholder="+54 11 1234-5678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea id="notes" name="notes" value={form.notes}
                onChange={handleChange} placeholder="Objetivo, lesiones, historial..." rows={3} />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Link href="/clientes" className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 justify-center')}>
                Cancelar
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creando...' : 'Crear alumno'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
