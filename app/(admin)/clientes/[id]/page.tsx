import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowLeft, Mail, Phone, BookOpen, PlusCircle, FileText } from 'lucide-react'
import AssignProgramButton from '@/components/admin/AssignProgramButton'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/dashboard')

  const { data: client } = await supabase
    .from('clients').select('*').eq('id', id).eq('trainer_id', trainer.id).single()
  if (!client) notFound()

  const { data: assignments } = await supabase
    .from('client_programs')
    .select(`id, status, start_date, assigned_at, programs ( id, title, goal, difficulty, duration_weeks )`)
    .eq('client_id', client.id)
    .order('assigned_at', { ascending: false })

  const { data: allPrograms } = await supabase
    .from('programs').select('id, title').eq('trainer_id', trainer.id).order('title')

  const goalLabels: Record<string, string> = {
    strength: 'Fuerza', hypertrophy: 'Hipertrofia', fat_loss: 'Pérdida de grasa',
    endurance: 'Resistencia', general: 'General'
  }
  const diffLabels: Record<string, string> = {
    beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado'
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clientes" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold">{client.full_name}</h1>
        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
          {client.status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-500">Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-zinc-400" />{client.email}</p>
            {client.phone && <p className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-zinc-400" />{client.phone}</p>}
          </CardContent>
        </Card>

        {client.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />Notas internas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4" />Programas asignados</h2>
          <AssignProgramButton clientId={client.id} programs={allPrograms ?? []} />
        </div>

        {assignments && assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map((a: any) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/programas/${a.programs.id}/edit`} className="font-semibold text-sm hover:underline">
                        {a.programs.title}
                      </Link>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {a.programs.goal && <Badge variant="outline" className="text-xs">{goalLabels[a.programs.goal]}</Badge>}
                        {a.programs.difficulty && <Badge variant="outline" className="text-xs">{diffLabels[a.programs.difficulty]}</Badge>}
                        {a.programs.duration_weeks && <Badge variant="outline" className="text-xs">{a.programs.duration_weeks} sem</Badge>}
                      </div>
                    </div>
                    <Badge variant={a.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0 text-xs">
                      {a.status === 'active' ? 'Activo' : a.status === 'completed' ? 'Completado' : 'Pausado'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-zinc-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-sm">Sin programas asignados aún</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
