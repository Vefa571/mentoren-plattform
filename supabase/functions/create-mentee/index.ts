import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Caller verifizieren — muss Admin sein
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

    const { name, email } = await req.json()

    if (!name?.trim() || !email?.trim()) {
      return json({ error: 'Name und E-Mail sind erforderlich' }, 400)
    }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim(),
      { data: { name: name.trim(), role: 'mentee' } }
    )

    if (error) return json({ error: error.message }, 400)

    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        name: name.trim(),
        email: email.trim(),
        role: 'mentee',
      })
    }

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
