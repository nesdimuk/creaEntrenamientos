'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, Check } from 'lucide-react'

interface Trainer {
  id: string; brand_name: string; tagline?: string;
  primary_color: string; accent_color: string; logo_url?: string
}

export default function BrandingForm({ trainer }: { trainer: Trainer }) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    brand_name: trainer.brand_name ?? 'Said Coach',
    tagline: trainer.tagline ?? '',
    primary_color: trainer.primary_color ?? '#18181b',
    accent_color: trainer.accent_color ?? '#f97316',
  })

  function set(key: string, val: string) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSave() {
    setSaving(true)
    await supabase.from('trainer_profile').update(form).eq('id', trainer.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Identidad de marca</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre de tu marca</Label>
            <Input value={form.brand_name} onChange={e => set('brand_name', e.target.value)} placeholder="Said Coach" />
          </div>
          <div className="space-y-1.5">
            <Label>Tagline / slogan</Label>
            <Input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Transforma tu cuerpo, transforma tu vida" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Colores</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color primario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => set('primary_color', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-zinc-200"
                />
                <Input value={form.primary_color} onChange={e => set('primary_color', e.target.value)}
                  className="font-mono text-sm" placeholder="#18181b" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color de acento</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={e => set('accent_color', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-zinc-200"
                />
                <Input value={form.accent_color} onChange={e => set('accent_color', e.target.value)}
                  className="font-mono text-sm" placeholder="#f97316" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader><CardTitle className="text-base">Vista previa</CardTitle></CardHeader>
        <CardContent>
          <div
            className="rounded-xl p-4 text-white flex items-center gap-3"
            style={{ backgroundColor: form.primary_color }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: form.accent_color }}>
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold">{form.brand_name || 'Said Coach'}</p>
              {form.tagline && <p className="text-xs opacity-75">{form.tagline}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saved ? <><Check className="w-4 h-4 mr-1.5" />Guardado</> : saving ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  )
}
