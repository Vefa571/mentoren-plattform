import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MenteeForm({ onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Name und E-Mail ausfüllen.')
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
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      }
    )

    const result = await res.json()
    setSaving(false)

    if (!res.ok || result.error) {
      setError(result.error ?? 'Unbekannter Fehler')
      return
    }

    setSuccess(true)
    setTimeout(onSaved, 2000)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-green-700 font-medium">Einladung gesendet!</p>
        <p className="text-green-600 text-sm mt-1">{email} hat eine Einladungs-E-Mail erhalten.</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Mentee einladen</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="mentee@beispiel.de"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-400">Der Mentee erhält eine Einladungs-E-Mail und legt sein Passwort selbst fest.</p>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Senden...' : 'Einladung senden'}
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
