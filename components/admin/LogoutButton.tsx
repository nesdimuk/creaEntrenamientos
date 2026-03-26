'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LogoutButton({ iconOnly }: { iconOnly?: boolean }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (iconOnly) {
    return (
      <button onClick={handleLogout} className="text-zinc-400 hover:text-white transition-colors p-1">
        <LogOut className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors w-full"
    >
      <LogOut className="w-4 h-4" />
      Cerrar sesión
    </button>
  )
}
