import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, ExternalLink } from 'lucide-react'
import NewExerciseButton from '@/components/admin/NewExerciseButton'

const categoryColors: Record<string, string> = {
  push: 'bg-blue-100 text-blue-700', pull: 'bg-purple-100 text-purple-700',
  legs: 'bg-green-100 text-green-700', core: 'bg-yellow-100 text-yellow-700',
  cardio: 'bg-red-100 text-red-700', mobility: 'bg-teal-100 text-teal-700',
  other: 'bg-zinc-100 text-zinc-600'
}
const categoryLabels: Record<string, string> = {
  push: 'Empuje', pull: 'Jalón', legs: 'Piernas', core: 'Core',
  cardio: 'Cardio', mobility: 'Movilidad', other: 'Otro'
}

export default async function EjerciciosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/dashboard')

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`is_global.eq.true,trainer_id.eq.${trainer.id}`)
    .order('name')

  const globalExercises = exercises?.filter(e => e.is_global) ?? []
  const myExercises = exercises?.filter(e => !e.is_global && e.trainer_id === trainer.id) ?? []

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{exercises?.length ?? 0} ejercicios disponibles</p>
        </div>
        <NewExerciseButton trainerId={trainer.id} />
      </div>

      {myExercises.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-sm text-zinc-500 uppercase tracking-wide mb-3">Mis ejercicios</h2>
          <div className="grid gap-2">
            {myExercises.map(ex => <ExerciseRow key={ex.id} ex={ex} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold text-sm text-zinc-500 uppercase tracking-wide mb-3">Biblioteca global</h2>
        <div className="grid gap-2">
          {globalExercises.map(ex => <ExerciseRow key={ex.id} ex={ex} />)}
        </div>
      </section>
    </div>
  )
}

function ExerciseRow({ ex }: { ex: any }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{ex.name}</p>
            {ex.muscle_group && <p className="text-xs text-zinc-500 truncate">{ex.muscle_group}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ex.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[ex.category] ?? categoryColors.other}`}>
              {categoryLabels[ex.category] ?? ex.category}
            </span>
          )}
          {ex.video_url && (
            <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
