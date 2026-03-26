'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlusCircle, Trash2, ChevronDown, ChevronUp, ExternalLink, GripVertical, Clock } from 'lucide-react'

interface Exercise { id: string; name: string; category?: string; video_url?: string }
interface WorkoutExercise {
  id?: string; exercise_id: string; exercise_name: string; order_index: number
  sets?: number; reps?: string; weight?: string; rest_seconds?: number
  tempo?: string; notes?: string; superset_group?: number
}
interface Workout {
  id?: string; title: string; week_number: number; day_number: number
  notes?: string; estimated_duration_min?: number; order_index: number
  workout_exercises: WorkoutExercise[]
}

export default function WorkoutBuilder({
  programId, durationWeeks, initialWorkouts, exercises
}: {
  programId: string; durationWeeks: number
  initialWorkouts: any[]; exercises: Exercise[]
}) {
  const supabase = createClient()
  const [workouts, setWorkouts] = useState<Workout[]>(
    initialWorkouts.map(w => ({
      ...w,
      workout_exercises: (w.workout_exercises ?? []).map((we: any) => ({
        ...we, exercise_name: we.exercises?.name ?? '',
      }))
    }))
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addExOpen, setAddExOpen] = useState<string | null>(null)
  const [exSearch, setExSearch] = useState('')

  function workoutKey(w: Workout) { return w.id ?? `new-${w.week_number}-${w.day_number}-${w.order_index}` }

  async function addWorkout() {
    const maxWeek = workouts.length > 0 ? Math.max(...workouts.map(w => w.week_number)) : 1
    const weekWorkouts = workouts.filter(w => w.week_number === maxWeek)
    const maxDay = weekWorkouts.length > 0 ? Math.max(...weekWorkouts.map(w => w.day_number)) : 0

    const { data } = await supabase
      .from('workouts')
      .insert({
        program_id: programId,
        title: `Semana ${maxWeek} · Día ${maxDay + 1}`,
        week_number: maxWeek,
        day_number: maxDay + 1,
        order_index: workouts.length,
      })
      .select('id, title, week_number, day_number, order_index')
      .single()

    if (data) {
      setWorkouts(prev => [...prev, { ...data, workout_exercises: [] }])
      setExpandedId(data.id)
    }
  }

  async function deleteWorkout(w: Workout) {
    if (w.id) await supabase.from('workouts').delete().eq('id', w.id)
    setWorkouts(prev => prev.filter(x => workoutKey(x) !== workoutKey(w)))
  }

  async function updateWorkoutField(w: Workout, field: string, value: any) {
    setWorkouts(prev => prev.map(x => workoutKey(x) === workoutKey(w) ? { ...x, [field]: value } : x))
    if (w.id) await supabase.from('workouts').update({ [field]: value }).eq('id', w.id)
  }

  function filteredExercises() {
    if (!exSearch) return exercises
    const q = exSearch.toLowerCase()
    return exercises.filter(e => e.name.toLowerCase().includes(q))
  }

  async function addExercise(w: Workout, ex: Exercise) {
    if (!w.id) return
    const { data } = await supabase
      .from('workout_exercises')
      .insert({ workout_id: w.id, exercise_id: ex.id, order_index: w.workout_exercises.length, sets: 3, reps: '8-12' })
      .select('id, order_index, sets, reps, weight, rest_seconds, tempo, notes, superset_group')
      .single()

    if (data) {
      const newWe: WorkoutExercise = { ...data, exercise_id: ex.id, exercise_name: ex.name }
      setWorkouts(prev => prev.map(x =>
        workoutKey(x) === workoutKey(w)
          ? { ...x, workout_exercises: [...x.workout_exercises, newWe] }
          : x
      ))
    }
    setAddExOpen(null); setExSearch('')
  }

  async function updateExerciseField(w: Workout, we: WorkoutExercise, field: string, value: any) {
    const v = value === '' ? null : value
    setWorkouts(prev => prev.map(x =>
      workoutKey(x) === workoutKey(w)
        ? { ...x, workout_exercises: x.workout_exercises.map(e => e.id === we.id ? { ...e, [field]: v } : e) }
        : x
    ))
    if (we.id) await supabase.from('workout_exercises').update({ [field]: v }).eq('id', we.id)
  }

  async function removeExercise(w: Workout, we: WorkoutExercise) {
    if (we.id) await supabase.from('workout_exercises').delete().eq('id', we.id)
    setWorkouts(prev => prev.map(x =>
      workoutKey(x) === workoutKey(w)
        ? { ...x, workout_exercises: x.workout_exercises.filter(e => e.id !== we.id) }
        : x
    ))
  }

  const weekGroups = workouts.reduce<Record<number, Workout[]>>((acc, w) => {
    if (!acc[w.week_number]) acc[w.week_number] = []
    acc[w.week_number].push(w)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(weekGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([week, ws]) => (
        <div key={week}>
          <h2 className="font-bold text-sm text-zinc-500 uppercase tracking-wide mb-3">Semana {week}</h2>
          <div className="space-y-3">
            {ws.sort((a, b) => a.day_number - b.day_number).map(w => {
              const key = workoutKey(w)
              const isExpanded = expandedId === key || expandedId === w.id

              return (
                <Card key={key} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-zinc-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : (w.id ?? key))}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <GripVertical className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{w.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-400">{w.workout_exercises.length} ejercicios</span>
                          {w.estimated_duration_min && (
                            <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />{w.estimated_duration_min} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); deleteWorkout(w) }}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Título de la sesión</Label>
                          <Input value={w.title}
                            onChange={e => updateWorkoutField(w, 'title', e.target.value)}
                            className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Semana</Label>
                          <Input type="number" min="1" value={w.week_number}
                            onChange={e => updateWorkoutField(w, 'week_number', parseInt(e.target.value))}
                            className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Día</Label>
                          <Input type="number" min="1" value={w.day_number}
                            onChange={e => updateWorkoutField(w, 'day_number', parseInt(e.target.value))}
                            className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duración (min)</Label>
                          <Input type="number" min="0" value={w.estimated_duration_min ?? ''}
                            onChange={e => updateWorkoutField(w, 'estimated_duration_min', e.target.value ? parseInt(e.target.value) : null)}
                            className="h-8 text-sm" placeholder="60" />
                        </div>
                        <div className="col-span-2 md:col-span-3 space-y-1">
                          <Label className="text-xs">Notas de la sesión</Label>
                          <Input value={w.notes ?? ''}
                            onChange={e => updateWorkoutField(w, 'notes', e.target.value)}
                            className="h-8 text-sm" placeholder="Indicaciones generales..." />
                        </div>
                      </div>

                      {w.workout_exercises.length > 0 && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-1 px-2 text-xs text-zinc-400 font-medium">
                            <span className="col-span-4">Ejercicio</span>
                            <span className="col-span-1 text-center">Series</span>
                            <span className="col-span-2 text-center">Reps</span>
                            <span className="col-span-2 text-center">Peso</span>
                            <span className="col-span-2 text-center">Desc (s)</span>
                            <span className="col-span-1"></span>
                          </div>
                          {w.workout_exercises.map(we => (
                            <div key={we.id} className="grid grid-cols-12 gap-1 items-center bg-zinc-50 rounded-lg px-2 py-2">
                              <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                                <span className="text-sm font-medium truncate">{we.exercise_name}</span>
                              </div>
                              <div className="col-span-1">
                                <Input type="number" min="1" value={we.sets ?? ''}
                                  onChange={e => updateExerciseField(w, we, 'sets', e.target.value ? parseInt(e.target.value) : null)}
                                  className="h-7 text-xs text-center px-1" placeholder="3" />
                              </div>
                              <div className="col-span-2">
                                <Input value={we.reps ?? ''}
                                  onChange={e => updateExerciseField(w, we, 'reps', e.target.value)}
                                  className="h-7 text-xs text-center px-1" placeholder="8-12" />
                              </div>
                              <div className="col-span-2">
                                <Input value={we.weight ?? ''}
                                  onChange={e => updateExerciseField(w, we, 'weight', e.target.value)}
                                  className="h-7 text-xs text-center px-1" placeholder="RPE 8" />
                              </div>
                              <div className="col-span-2">
                                <Input type="number" min="0" value={we.rest_seconds ?? ''}
                                  onChange={e => updateExerciseField(w, we, 'rest_seconds', e.target.value ? parseInt(e.target.value) : null)}
                                  className="h-7 text-xs text-center px-1" placeholder="90" />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button onClick={() => removeExercise(w, we)}
                                  className="text-zinc-300 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="col-span-11">
                                <Input value={we.notes ?? ''}
                                  onChange={e => updateExerciseField(w, we, 'notes', e.target.value)}
                                  className="h-6 text-xs px-2 text-zinc-500 bg-white"
                                  placeholder="Notas de coaching..." />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button variant="outline" size="sm" className="w-full border-dashed"
                        onClick={() => { setAddExOpen(w.id ?? key); setExSearch('') }}>
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />Agregar ejercicio
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      <Button variant="outline" className="w-full border-dashed" onClick={addWorkout}>
        <PlusCircle className="w-4 h-4 mr-2" />Agregar sesión
      </Button>

      <Dialog open={!!addExOpen} onOpenChange={v => !v && setAddExOpen(null)}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Agregar ejercicio</DialogTitle></DialogHeader>
          <Input placeholder="Buscar ejercicio..." value={exSearch}
            onChange={e => setExSearch(e.target.value)} className="mt-1" autoFocus />
          <div className="overflow-y-auto flex-1 mt-2 space-y-1 pr-1">
            {filteredExercises().map(ex => {
              const w = workouts.find(w => (w.id ?? workoutKey(w)) === addExOpen)
              return (
                <button key={ex.id}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                  onClick={() => w && addExercise(w, ex)}>
                  <span className="text-sm font-medium">{ex.name}</span>
                  <div className="flex items-center gap-1.5">
                    {ex.video_url && <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />}
                    {ex.category && (
                      <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{ex.category}</span>
                    )}
                  </div>
                </button>
              )
            })}
            {filteredExercises().length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-4">No se encontraron ejercicios</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
