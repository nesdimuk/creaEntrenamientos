import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BrandingForm from '@/components/admin/BrandingForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!trainer) redirect('/dashboard')

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Personaliza tu marca</p>
      </div>
      <BrandingForm trainer={trainer} />
    </div>
  )
}
