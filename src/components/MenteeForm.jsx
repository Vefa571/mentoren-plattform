import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MenteeForm({ onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !username.trim() || password.length < 6) {
      setError('Alle Felder ausfüllen — Passwort mindestens 6 Zeichen.')
      return
    }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mentee`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password }),
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
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Neuen Mentee anlegen</h3>
      <p className="text-xs text-gray-400 mb-4">Du vergibst die Zugangsdaten — teile sie direkt mit dem Mentee.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="z.B. Ahmed Mustermann"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Benutzername</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="z.B. ahmed123"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Nur Buchstaben, Zahlen, _ und -</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Anlegen...' : 'Mentee anlegen'}
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
