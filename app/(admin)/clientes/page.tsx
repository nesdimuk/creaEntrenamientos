import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Users, PlusCircle, Mail, Phone } from 'lucide-react'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainer_profile').select('id').eq('user_id', user.id).single()
  if (!trainer) redirect('/dashboard')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, email, phone, status, created_at')
    .eq('trainer_id', trainer.id)
    .order('full_name')

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{clients?.length ?? 0} alumnos registrados</p>
        </div>
        <Link href="/clientes/new" className={cn(buttonVariants())}>
          <PlusCircle className="w-4 h-4 mr-1.5" />Nuevo alumno
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid gap-3">
          {clients.map(client => (
            <Link key={client.id} href={`/clientes/${client.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-base font-bold text-zinc-600 flex-shrink-0">
                      {client.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{client.full_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{client.email}
                        </span>
                        {client.phone && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0">
                    {client.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="font-medium text-zinc-600">No tienes alumnos aún</p>
            <p className="text-sm text-zinc-400 mt-1 mb-4">Crea tu primer alumno para empezar</p>
            <Link href="/clientes/new" className={cn(buttonVariants())}>
              <PlusCircle className="w-4 h-4 mr-1.5" />Agregar alumno
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
