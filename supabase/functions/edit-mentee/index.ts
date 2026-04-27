import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DOMAIN = '@mentoren-plattform.intern'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return json({ error: 'Nicht autorisiert' }, 401)

    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) return json({ error: 'Nicht autorisiert' }, 401)

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') return json({ error: 'Kein Zugriff' }, 403)

    const { action, menteeId, name, username, password } = await req.json()

    if (!menteeId) return json({ error: 'Mentee-ID fehlt' }, 400)

    if (action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(menteeId)
      if (error) return json({ error: error.message }, 400)
      return json({ success: true })
    }

    if (action === 'update') {
      const authUpdates: Record<string, unknown> = {}
      const profileUpdates: Record<string, string> = {}

      if (name?.trim()) profileUpdates.name = name.trim()

      if (username?.trim()) {
        const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
        if (!clean) return json({ error: 'Ungültiger Benutzername' }, 400)
        authUpdates.email = clean + DOMAIN
        profileUpdates.email = clean + DOMAIN
      }

      if (password) {
        if (password.length < 6) return json({ error: 'Passwort mindestens 6 Zeichen' }, 400)
        authUpdates.password = password
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(menteeId, authUpdates)
        if (error) return json({ error: error.message }, 400)
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabaseAdmin.from('profiles').update(profileUpdates).eq('id', menteeId)
        if (error) return json({ error: error.message }, 400)
      }

      return json({ success: true })
    }

    return json({ error: 'Unbekannte Aktion' }, 400)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return json({ error: `Serverfehler: ${msg}` }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
