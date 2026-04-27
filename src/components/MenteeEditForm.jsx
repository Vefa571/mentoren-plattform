import { useState } from 'react'
import { supabase } from '../lib/supabase'

const DOMAIN = '@mentoren-plattform.intern'

export default function MenteeEditForm({ mentee, onSaved, onCancel }) {
  const currentUsername = mentee.email?.replace(DOMAIN, '') ?? ''

  const [name, setName] = useState(mentee.name)
  const [username, setUsername] = useState(currentUsername)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !username.trim()) {
      setError('Name und Benutzername dürfen nicht leer sein.')
      return
    }
    if (password && password.length < 6) {
      setError('Passwort mindestens 6 Zeichen.')
      return
    }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-mentee`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update',
          menteeId: mentee.id,
          name: name.trim(),
          username: username.trim(),
          password: password || undefined,
        }),
      }
    )

    const result = await res.json()
    setSaving(false)

    if (!res.ok || result.error) {
      setError(result.error ?? 'Unbekannter Fehler')
      return
    }

    onSaved()
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Mentee bearbeiten</h3>
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Benutzername</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Leer lassen = unverändert"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
