'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { PlusCircle } from 'lucide-react'

interface Program { id: string; title: string }

export default function AssignProgramButton({ clientId, programs }: { clientId: string; programs: Program[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [programId, setProgramId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAssign() {
    if (!programId) { setError('Selecciona un programa'); return }
    setLoading(true); setError('')

    const { error: err } = await supabase
      .from('client_programs')
      .insert({ client_id: clientId, program_id: programId, start_date: startDate || null })

    if (err) { setError(err.message); setLoading(false); return }

    setOpen(false); setProgramId(''); setStartDate('')
    router.refresh(); setLoading(false)
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />Asignar programa
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Asignar programa</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Programa</Label>
              <Select value={programId} onValueChange={(v) => setProgramId(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar programa..." /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de inicio (opcional)</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleAssign} disabled={loading} className="flex-1">
                {loading ? 'Asignando...' : 'Asignar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
