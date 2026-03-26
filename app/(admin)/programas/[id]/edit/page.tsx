import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import WorkoutBuilder from '@/components/admin/WorkoutBuilder'

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/dashboard')

  const { data: program } = await supabase
    .from('programs').select('*').eq('id', id).eq('trainer_id', trainer.id).single()
  if (!program) notFound()

  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      id, title, week_number, day_number, notes, estimated_duration_min, order_index,
      workout_exercises (
        id, order_index, sets, reps, weight, rest_seconds, tempo, notes, superset_group,
        exercises ( id, name, category, video_url )
      )
    `)
    .eq('program_id', id)
    .order('week_number')
    .order('day_number')
    .order('order_index')

  const workoutsWithSortedExercises = (workouts ?? []).map(w => ({
    ...w,
    workout_exercises: [...(w.workout_exercises ?? [])].sort((a, b) => a.order_index - b.order_index)
  }))

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, category, muscle_group, video_url')
    .or(`is_global.eq.true,trainer_id.eq.${trainer.id}`)
    .order('name')

  return (
    <div className="p-4 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/programas" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{program.title}</h1>
          <p className="text-sm text-zinc-500">{program.duration_weeks} semanas · Editor de sesiones</p>
        </div>
      </div>

      <WorkoutBuilder
        programId={program.id}
        durationWeeks={program.duration_weeks ?? 4}
        initialWorkouts={workoutsWithSortedExercises as any}
        exercises={exercises ?? []}
      />
    </div>
  )
}
