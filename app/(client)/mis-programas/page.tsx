import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, Target } from 'lucide-react'

const goalLabels: Record<string, string> = {
  strength: 'Fuerza', hypertrophy: 'Hipertrofia', fat_loss: 'Pérdida de grasa',
  endurance: 'Resistencia', general: 'General'
}

export default async function MisProgramasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()
  if (!client) redirect('/login')

  const { data: assignments } = await supabase
    .from('client_programs')
    .select(`
      id, status, start_date, assigned_at,
      programs ( id, title, goal, difficulty, duration_weeks, description )
    `)
    .eq('client_id', client.id)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-xl font-bold">Hola, {client.full_name.split(' ')[0]} 👋</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Estos son tus programas activos</p>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((a: any) => (
            <Link key={a.id} href={`/mis-programas/${a.programs.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--brand-accent, #f97316)' }}>
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{a.programs.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {a.programs.goal && (
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Target className="w-3 h-3" />{goalLabels[a.programs.goal]}
                          </span>
                        )}
                        {a.programs.duration_weeks && (
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Calendar className="w-3 h-3" />{a.programs.duration_weeks} semanas
                          </span>
                        )}
                      </div>
                      {a.programs.description && (
                        <p className="text-sm text-zinc-500 mt-1.5 line-clamp-2">{a.programs.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="font-medium text-zinc-600">Aún no tienes programas asignados</p>
            <p className="text-sm text-zinc-400 mt-1">Tu entrenador te asignará un programa pronto</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
