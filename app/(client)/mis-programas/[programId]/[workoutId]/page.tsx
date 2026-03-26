import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { ArrowLeft, Clock } from 'lucide-react'
import WorkoutSession from '@/components/client/WorkoutSession'

export default async function WorkoutSessionPage({
  params
}: { params: Promise<{ programId: string; workoutId: string }> }) {
  const { programId, workoutId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients').select('id').eq('user_id', user.id).single()
  if (!client) redirect('/login')

  const { data: assignment } = await supabase
    .from('client_programs').select('id').eq('client_id', client.id).eq('program_id', programId).single()
  if (!assignment) notFound()

  const { data: workout } = await supabase
    .from('workouts')
    .select(`
      id, title, notes, estimated_duration_min,
      workout_exercises (
        id, order_index, sets, reps, weight, rest_seconds, tempo, notes, superset_group,
        exercises ( id, name, category, muscle_group, video_url, description )
      )
    `)
    .eq('id', workoutId)
    .eq('program_id', programId)
    .single()
  if (!workout) notFound()

  // Flatten exercises (Supabase returns array for joins)
  const sortedExercises = [...(workout.workout_exercises ?? [])]
    .sort((a, b) => a.order_index - b.order_index)
    .map(we => ({
      ...we,
      exercises: Array.isArray(we.exercises) ? we.exercises[0] : we.exercises,
    }))

  const today = new Date().toISOString().split('T')[0]
  const { data: existingLog } = await supabase
    .from('workout_logs')
    .select('id, notes_text, completed, perceived_effort')
    .eq('client_id', client.id)
    .eq('workout_id', workoutId)
    .gte('logged_at', `${today}T00:00:00`)
    .lte('logged_at', `${today}T23:59:59`)
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Link href={`/mis-programas/${programId}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), '-ml-2')}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{workout.title}</h1>
          {workout.estimated_duration_min && (
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{workout.estimated_duration_min} min aprox.
            </p>
          )}
        </div>
      </div>

      {workout.notes && (
        <div className="mx-4 mb-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
          {workout.notes}
        </div>
      )}

      <WorkoutSession
        workout={{ ...workout, workout_exercises: sortedExercises as any }}
        clientId={client.id}
        programId={programId}
        existingLog={existingLog ?? null}
      />
    </div>
  )
}
