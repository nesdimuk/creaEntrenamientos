import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, BookOpen, LogOut } from 'lucide-react'
import ClientLogoutButton from '@/components/client/ClientLogoutButton'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find which trainer owns this client to get branding
  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, trainer_id')
    .eq('user_id', user.id)
    .single()

  let brand = { brand_name: 'Said Coach', primary_color: '#18181b', accent_color: '#f97316', tagline: '' }

  if (client?.trainer_id) {
    const { data: trainer } = await supabase
      .from('trainer_profile')
      .select('brand_name, primary_color, accent_color, tagline')
      .eq('id', client.trainer_id)
      .single()
    if (trainer) brand = { ...brand, ...trainer }
  }

  const brandStyle = `
    :root {
      --brand-primary: ${brand.primary_color};
      --brand-accent: ${brand.accent_color};
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: brandStyle }} />
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 text-white shadow-sm"
          style={{ backgroundColor: brand.primary_color }}
        >
          <Link href="/mis-programas" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: brand.accent_color }}
            >
              <Dumbbell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">{brand.brand_name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-70 hidden sm:block">{client?.full_name}</span>
            <ClientLogoutButton />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 pb-20">
          {children}
        </main>

        {/* Bottom nav */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 border-t text-white flex"
          style={{ backgroundColor: brand.primary_color }}
        >
          <Link
            href="/mis-programas"
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 opacity-80 hover:opacity-100 transition-opacity"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">Mis programas</span>
          </Link>
        </nav>
      </div>
    </>
  )
}
