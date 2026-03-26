import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BookOpen, PlusCircle, Pencil } from 'lucide-react'

const goalLabels: Record<string, string> = {
  strength: 'Fuerza', hypertrophy: 'Hipertrofia', fat_loss: 'Pérdida de grasa',
  endurance: 'Resistencia', general: 'General'
}
const diffLabels: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado'
}

export default async function ProgramasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/dashboard')

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, goal, difficulty, duration_weeks, description, created_at')
    .eq('trainer_id', trainer.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Programas</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{programs?.length ?? 0} programas creados</p>
        </div>
        <Link href="/programas/new" className={cn(buttonVariants())}>
          <PlusCircle className="w-4 h-4 mr-1.5" />Nuevo programa
        </Link>
      </div>

      {programs && programs.length > 0 ? (
        <div className="grid gap-3">
          {programs.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {p.goal && <span className="text-xs text-zinc-500">{goalLabels[p.goal]}</span>}
                      {p.difficulty && <span className="text-xs text-zinc-400">· {diffLabels[p.difficulty]}</span>}
                      {p.duration_weeks && <span className="text-xs text-zinc-400">· {p.duration_weeks} sem</span>}
                    </div>
                  </div>
                </div>
                <Link href={`/programas/${p.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-shrink-0')}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />Editar
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="font-medium text-zinc-600">No hay programas aún</p>
            <p className="text-sm text-zinc-400 mt-1 mb-4">Crea tu primer programa de entrenamiento</p>
            <Link href="/programas/new" className={cn(buttonVariants())}>
              <PlusCircle className="w-4 h-4 mr-1.5" />Crear programa
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
