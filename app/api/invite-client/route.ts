import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, clientId } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectTo = `${origin}/auth/confirm`

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Try invite (for new users)
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { client_id: clientId },
  })

  if (!inviteError && inviteData.user) {
    // New user — link to client row
    await supabaseAdmin.from('clients').update({ user_id: inviteData.user.id }).eq('id', clientId)
    return NextResponse.json({ success: true })
  }

  // User already exists — send magic link email using anon client
  const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { error: otpError } = await supabasePublic.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  })

  if (otpError) {
    return NextResponse.json({ error: otpError.message }, { status: 500 })
  }

  // Ensure user_id is linked in clients table
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
  const authUser = existingUser?.users.find(u => u.email === email)
  if (authUser) {
    await supabaseAdmin.from('clients').update({ user_id: authUser.id }).eq('id', clientId).is('user_id', null)
  }

  return NextResponse.json({ success: true })
}
