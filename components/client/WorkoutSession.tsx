'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Mic, MicOff, ExternalLink, ChevronDown, ChevronUp, Timer, Check } from 'lucide-react'

interface WorkoutExercise {
  id: string; order_index: number; sets?: number; reps?: string; weight?: string
  rest_seconds?: number; tempo?: string; notes?: string; superset_group?: number
  exercises: { id: string; name: string; category?: string; video_url?: string; description?: string }
}
interface Workout {
  id: string; title: string; notes?: string; estimated_duration_min?: number
  workout_exercises: WorkoutExercise[]
}
interface ExistingLog {
  id: string; notes_text?: string | null; completed: boolean; perceived_effort?: number | null
}

type SetLog = { reps: string; weight: string }

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function WorkoutSession({
  workout, clientId, programId, existingLog
}: {
  workout: Workout; clientId: string; programId: string; existingLog: ExistingLog | null
}) {
  const supabase = createClient()

  const [logId, setLogId] = useState<string | null>(existingLog?.id ?? null)
  const [notes, setNotes] = useState(existingLog?.notes_text ?? '')
  const [effort, setEffort] = useState<number>(existingLog?.perceived_effort ?? 0)
  const [completed, setCompleted] = useState(existingLog?.completed ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>(() => {
    const init: Record<string, SetLog[]> = {}
    workout.workout_exercises.forEach(we => {
      init[we.id] = Array.from({ length: we.sets ?? 3 }, () => ({ reps: '', weight: '' }))
    })
    return init
  })

  const [expandedEx, setExpandedEx] = useState<string | null>(workout.workout_exercises[0]?.id ?? null)
  const [restTimer, setRestTimer] = useState<{ seconds: number; weId: string } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  function startRestTimer(seconds: number, weId: string) {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTimer({ seconds, weId })
    timerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (!prev || prev.seconds <= 1) { clearInterval(timerRef.current!); return null }
        return { ...prev, seconds: prev.seconds - 1 }
      })
    }, 1000)
  }

  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome.'); return }

    const recognition = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(' ')
      setNotes(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  function updateSetLog(weId: string, setIdx: number, field: 'reps' | 'weight', value: string) {
    setSetLogs(prev => {
      const updated = [...(prev[weId] ?? [])]
      updated[setIdx] = { ...updated[setIdx], [field]: value }
      return { ...prev, [weId]: updated }
    })
  }

  async function saveSession(markCompleted = false) {
    setSaving(true)
    let currentLogId = logId

    if (!currentLogId) {
      const { data } = await supabase
        .from('workout_logs')
        .insert({ client_id: clientId, workout_id: workout.id, notes_text: notes || null, perceived_effort: effort || null, completed: markCompleted })
        .select('id').single()
      if (!data) { setSaving(false); return }
      currentLogId = data.id
      setLogId(data.id)
    } else {
      await supabase.from('workout_logs')
        .update({ notes_text: notes || null, perceived_effort: effort || null, completed: markCompleted })
        .eq('id', currentLogId)
    }

    for (const we of workout.workout_exercises) {
      const sets = setLogs[we.id] ?? []
      const toInsert = sets.map((s, i) => ({ ...s, setNumber: i + 1 })).filter(s => s.reps || s.weight)
      if (toInsert.length > 0) {
        await supabase.from('exercise_logs').delete()
          .eq('workout_log_id', currentLogId).eq('workout_exercise_id', we.id)
        await supabase.from('exercise_logs').insert(
          toInsert.map(s => ({
            workout_log_id: currentLogId, workout_exercise_id: we.id,
            set_number: s.setNumber, reps_done: s.reps || null, weight_done: s.weight || null,
          }))
        )
      }
    }

    if (markCompleted) setCompleted(true)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (completed) {
    return (
      <div className="px-4 py-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-1">¡Sesión completada!</h2>
        <p className="text-zinc-500 text-sm mb-6">Excelente trabajo hoy</p>
        <a href={`/mis-programas/${programId}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 underline">
          ← Volver al programa
        </a>
      </div>
    )
  }

  return (
    <div className="px-4 pb-32 space-y-3">
      {restTimer && (
        <div className="sticky top-14 z-20 rounded-xl p-3 text-white text-center font-bold text-lg shadow-lg"
          style={{ backgroundColor: 'var(--brand-accent, #f97316)' }}>
          <Timer className="inline w-5 h-5 mr-2" />
          Descanso: {Math.floor(restTimer.seconds / 60)}:{String(restTimer.seconds % 60).padStart(2, '0')}
        </div>
      )}

      {workout.workout_exercises.map((we, idx) => {
        const isExpanded = expandedEx === we.id
        const logs = setLogs[we.id] ?? []
        const filledSets = logs.filter(s => s.reps || s.weight).length

        return (
          <Card key={we.id}>
            <div className="p-4 cursor-pointer select-none flex items-center justify-between gap-3"
              onClick={() => setExpandedEx(isExpanded ? null : we.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: 'var(--brand-primary, #18181b)' }}>
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{we.exercises.name}</p>
                  <p className="text-xs text-zinc-500">
                    {we.sets} series · {we.reps}{we.weight ? ` · ${we.weight}` : ''}
                    {we.rest_seconds ? ` · ${we.rest_seconds}s` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {filledSets > 0 && <span className="text-xs text-green-600 font-medium">{filledSets}/{we.sets}</span>}
                {we.exercises.video_url && (
                  <a href={we.exercises.video_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()} className="text-zinc-400 hover:text-zinc-600">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-3 space-y-3">
                {we.exercises.description && (
                  <p className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded-lg">{we.exercises.description}</p>
                )}
                {we.notes && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">{we.notes}</p>
                )}
                {we.tempo && <p className="text-xs text-zinc-400">Tempo: <span className="font-mono">{we.tempo}</span></p>}

                <div>
                  <div className="grid grid-cols-10 gap-1 text-xs text-zinc-400 font-medium mb-1.5 px-1">
                    <span className="col-span-1">#</span>
                    <span className="col-span-3">Objetivo</span>
                    <span className="col-span-3 text-center">Reps</span>
                    <span className="col-span-3 text-center">Peso</span>
                  </div>
                  {Array.from({ length: we.sets ?? 3 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-10 gap-1 items-center mb-1.5">
                      <span className="col-span-1 text-xs text-zinc-400 font-medium pl-1">{i + 1}</span>
                      <span className="col-span-3 text-xs text-zinc-400 truncate">{we.reps}{we.weight ? ` · ${we.weight}` : ''}</span>
                      <div className="col-span-3">
                        <Input value={logs[i]?.reps ?? ''}
                          onChange={e => updateSetLog(we.id, i, 'reps', e.target.value)}
                          className="h-8 text-sm text-center px-1" placeholder={we.reps ?? '–'} inputMode="decimal" />
                      </div>
                      <div className="col-span-3">
                        <Input value={logs[i]?.weight ?? ''}
                          onChange={e => updateSetLog(we.id, i, 'weight', e.target.value)}
                          className="h-8 text-sm text-center px-1" placeholder={we.weight ?? '–'} inputMode="decimal" />
                      </div>
                    </div>
                  ))}
                </div>

                {we.rest_seconds && (
                  <Button variant="outline" size="sm" className="w-full"
                    onClick={() => startRestTimer(we.rest_seconds!, we.id)}>
                    <Timer className="w-3.5 h-3.5 mr-1.5" />Iniciar descanso ({we.rest_seconds}s)
                  </Button>
                )}
              </div>
            )}
          </Card>
        )
      })}

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Notas de la sesión</p>
            <Button variant={isListening ? 'destructive' : 'outline'} size="sm" onClick={toggleVoice} className="gap-1.5">
              {isListening ? <><MicOff className="w-3.5 h-3.5" />Detener</> : <><Mic className="w-3.5 h-3.5" />Dictar</>}
            </Button>
          </div>
          {isListening && (
            <div className="flex items-center gap-2 text-xs text-red-600 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />Escuchando... hablá ahora
            </div>
          )}
          <Textarea value={notes ?? ''} onChange={e => setNotes(e.target.value)}
            placeholder="¿Cómo te sentiste? ¿Qué mejoró?..." rows={3} />

          <div>
            <p className="text-xs text-zinc-500 mb-2">Esfuerzo percibido (1-10)</p>
            <div className="flex gap-1.5 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => setEffort(effort === n ? 0 : n)}
                  className="w-7 h-7 rounded-lg text-xs font-bold transition-colors"
                  style={n <= effort
                    ? { backgroundColor: 'var(--brand-accent, #f97316)', color: 'white' }
                    : { backgroundColor: '#f4f4f5', color: '#a1a1aa' }
                  }>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t flex gap-3 max-w-2xl mx-auto">
        <Button variant="outline" className="flex-1" onClick={() => saveSession(false)} disabled={saving}>
          {saved ? <><Check className="w-4 h-4 mr-1" />Guardado</> : saving ? 'Guardando...' : 'Guardar progreso'}
        </Button>
        <Button className="flex-1 text-white"
          style={{ backgroundColor: 'var(--brand-accent, #f97316)' }}
          onClick={() => saveSession(true)} disabled={saving}>
          <CheckCircle2 className="w-4 h-4 mr-1.5" />Completar sesión
        </Button>
      </div>
    </div>
  )
}
