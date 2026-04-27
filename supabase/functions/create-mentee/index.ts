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

    const { name, username, password } = await req.json()

    if (!name?.trim() || !username?.trim() || !password || password.length < 6) {
      return json({ error: 'Name, Benutzername und Passwort (min. 6 Zeichen) erforderlich' }, 400)
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!cleanUsername) {
      return json({ error: 'Ungültiger Benutzername (nur Buchstaben, Zahlen, _ und -)' }, 400)
    }

    const email = cleanUsername + DOMAIN

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), role: 'mentee' },
    })

    if (error) return json({ error: error.message }, 400)

    return json({ user: data.user })
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
