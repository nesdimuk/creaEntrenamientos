import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react'

export default async function ClientProgramPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients').select('id').eq('user_id', user.id).single()
  if (!client) redirect('/login')

  const { data: assignment } = await supabase
    .from('client_programs').select('id').eq('client_id', client.id).eq('program_id', programId).single()
  if (!assignment) notFound()

  const { data: program } = await supabase
    .from('programs').select('id, title, description, duration_weeks, goal, difficulty').eq('id', programId).single()
  if (!program) notFound()

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, title, week_number, day_number, estimated_duration_min, order_index')
    .eq('program_id', programId)
    .order('week_number').order('day_number').order('order_index')

  const weekGroups = (workouts ?? []).reduce<Record<number, typeof workouts>>((acc, w) => {
    if (!acc[w!.week_number]) acc[w!.week_number] = []
    acc[w!.week_number]!.push(w!)
    return acc
  }, {})

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 pt-2">
        <Link href="/mis-programas" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), '-ml-2')}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{program.title}</h1>
          {program.description && <p className="text-sm text-zinc-500 mt-0.5">{program.description}</p>}
        </div>
      </div>

      {Object.entries(weekGroups)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, ws]) => (
          <div key={week} className="mb-6">
            <h2 className="font-semibold text-sm text-zinc-500 uppercase tracking-wide mb-2">Semana {week}</h2>
            <div className="space-y-2">
              {ws!.sort((a, b) => a.day_number - b.day_number).map(w => (
                <Link key={w.id} href={`/mis-programas/${programId}/${w.id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow active:scale-[0.99] cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: 'var(--brand-primary, #18181b)' }}>
                          D{w.day_number}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{w.title}</p>
                          {w.estimated_duration_min && (
                            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />{w.estimated_duration_min} min
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

      {Object.keys(weekGroups).length === 0 && (
        <Card>
          <CardContent className="p-10 text-center text-zinc-400">
            <p className="text-sm">Este programa aún no tiene sesiones</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
