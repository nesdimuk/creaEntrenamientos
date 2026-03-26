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

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/confirm`

  // Try invite first; if user exists, generate a magic link instead
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { client_id: clientId },
  })

  if (inviteError) {
    // User already exists — send magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    // Link user_id to client row if not already linked
    if (linkData.user) {
      await supabaseAdmin
        .from('clients')
        .update({ user_id: linkData.user.id })
        .eq('id', clientId)
        .is('user_id', null)
    }

    return NextResponse.json({ success: true })
  }

  // New user created — link to client row
  if (inviteData.user) {
    await supabaseAdmin
      .from('clients')
      .update({ user_id: inviteData.user.id })
      .eq('id', clientId)
  }

  return NextResponse.json({ success: true })
}
