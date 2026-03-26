import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dumbbell, Users, BookOpen, LayoutDashboard, Settings, LogOut, Zap } from 'lucide-react'
import LogoutButton from '@/components/admin/LogoutButton'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Alumnos', icon: Users },
  { href: '/programas', label: 'Programas', icon: BookOpen },
  { href: '/ejercicios', label: 'Ejercicios', icon: Zap },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile')
    .select('brand_name, logo_url')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-zinc-900 text-white">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-700">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm truncate">{trainer?.brand_name ?? 'Said Coach'}</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-zinc-700">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-zinc-900 text-white flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">{trainer?.brand_name ?? 'Said Coach'}</span>
        </div>
        <LogoutButton iconOnly />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-900 border-t border-zinc-700 flex">
        {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
