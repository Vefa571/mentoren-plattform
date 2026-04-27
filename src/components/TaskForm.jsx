import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function TaskForm({ task, onSaved, onCancel }) {
  const { user } = useAuth()
  const [title, setTitle] = useState(task?.title ?? '')
  const [type, setType] = useState(task?.type ?? 'pages')
  const [targetValue, setTargetValue] = useState(task?.target_value ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const num = parseFloat(targetValue)
    if (!title.trim() || isNaN(num) || num <= 0) {
      setError('Bitte alle Felder korrekt ausfüllen.')
      return
    }

    setSaving(true)
    let dbError = null
    if (task) {
      const { error } = await supabase
        .from('tasks')
        .update({ title: title.trim(), type, target_value: num })
        .eq('id', task.id)
      dbError = error
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert({ title: title.trim(), type, target_value: num, created_by: user.id })
      dbError = error
    }
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      onSaved()
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-800 mb-4">{task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="z.B. Koran lesen"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pages">Seiten</option>
              <option value="minutes">Minuten</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Zielwert</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={targetValue}
              onChange={e => setTargetValue(e.target.value)}
              placeholder="z.B. 5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
