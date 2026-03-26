'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell } from 'lucide-react'

export default function AuthConfirmPage() {
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Check if trainer or client
        const { data: trainer } = await supabase
          .from('trainer_profile')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (trainer) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/mis-programas'
        }
      }
    })

    // Also try to get session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: trainer } = await supabase
          .from('trainer_profile')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (trainer) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/mis-programas'
        }
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center space-y-3">
        <div className="mx-auto w-14 h-14 bg-black rounded-2xl flex items-center justify-center animate-pulse">
          <Dumbbell className="w-7 h-7 text-white" />
        </div>
        <p className="text-zinc-500 text-sm">Verificando acceso...</p>
      </div>
    </div>
  )
}
