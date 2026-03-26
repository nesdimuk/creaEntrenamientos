import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { Users, BookOpen, PlusCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile')
    .select('id, brand_name')
    .eq('user_id', user.id)
    .single()

  if (!trainer) {
    await supabase.from('trainer_profile').insert({ user_id: user.id, brand_name: 'Said Coach' })
    redirect('/dashboard')
  }

  const trainerId = trainer.id
  const [{ count: clientCount }, { count: programCount }] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('trainer_id', trainerId),
    supabase.from('programs').select('id', { count: 'exact', head: true }).eq('trainer_id', trainerId),
  ])

  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, full_name, email, status, created_at')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Bienvenido, {user.email}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clientCount ?? 0}</p>
              <p className="text-xs text-zinc-500">Alumnos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{programCount ?? 0}</p>
              <p className="text-xs text-zinc-500">Programas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Acciones rápidas</p>
              <p className="text-xs text-zinc-500">Crea algo nuevo</p>
            </div>
            <div className="flex gap-2">
              <Link href="/clientes/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                <Users className="w-3.5 h-3.5 mr-1" />Alumno
              </Link>
              <Link href="/programas/new" className={cn(buttonVariants({ size: 'sm' }))}>
                <BookOpen className="w-3.5 h-3.5 mr-1" />Programa
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Alumnos recientes</h2>
          <Link href="/clientes" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Ver todos
          </Link>
        </div>
        {recentClients && recentClients.length > 0 ? (
          <div className="space-y-2">
            {recentClients.map(client => (
              <Link key={client.id} href={`/clientes/${client.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-600">
                        {client.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.full_name}</p>
                        <p className="text-xs text-zinc-500">{client.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-zinc-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-sm">Aún no tienes alumnos.</p>
              <Link href="/clientes/new" className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}>
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />Agregar alumno
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
