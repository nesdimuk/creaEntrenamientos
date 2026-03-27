'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell } from 'lucide-react'

async function redirectByRole(supabase: ReturnType<typeof createClient>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const { data: trainer } = await supabase
    .from('trainer_profile')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  window.location.href = trainer ? '/dashboard' : '/mis-programas'
  return true
}

export default function AuthConfirmPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))

      // Caso 1: code en query string (PKCE flow)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError('Link inválido o expirado. Pedí un nuevo acceso.')
          return
        }
        await redirectByRole(supabase)
        return
      }

      // Caso 2: access_token en el hash (implicit flow / magic link)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          setError('Error al verificar el acceso. Pedí un nuevo link.')
          return
        }
        await redirectByRole(supabase)
        return
      }

      // Caso 3: Ya hay sesión activa (recarga de página)
      const redirected = await redirectByRole(supabase)
      if (redirected) return

      // Caso 4: Esperar evento de auth (el cliente procesa el hash automáticamente)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          await redirectByRole(supabase)
        } else if (event === 'SIGNED_OUT') {
          setError('Link inválido o expirado. Pedí un nuevo acceso.')
        }
      })

      // Timeout de seguridad
      setTimeout(() => {
        setError('El link tardó demasiado. Intentá de nuevo.')
      }, 10000)
    }

    handleAuth()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="mx-auto w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-zinc-800 font-medium">Acceso no válido</p>
          <p className="text-zinc-500 text-sm">{error}</p>
          <a
            href="/login"
            className="inline-block mt-2 text-sm text-black underline underline-offset-4"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

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
