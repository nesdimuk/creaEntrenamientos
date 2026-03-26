import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, clientId } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/auth/callback?next=/mis-programas`,
    data: { client_id: clientId },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Link the auth user to the client row if user already exists
  if (data.user) {
    await supabaseAdmin
      .from('clients')
      .update({ user_id: data.user.id })
      .eq('id', clientId)
  }

  return NextResponse.json({ success: true })
}
