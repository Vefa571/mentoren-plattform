import { useState } from 'react'

export default function TaskCard({ task, log, onSave }) {
  const [value, setValue] = useState(log?.value ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const progress = log ? Math.min((log.value / task.target_value) * 100, 100) : 0
  const done = log?.value >= task.target_value
  const typeLabel = task.type === 'minutes' ? 'Min.' : 'Seiten'

  async function handleSave() {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setSaving(true)
    await onSave(num)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`bg-white rounded-xl border px-5 py-4 ${done ? 'border-green-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-gray-800">{task.title}</p>
          <p className="text-sm text-gray-500">Ziel: {task.target_value} {typeLabel}</p>
        </div>
        {done && (
          <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-0.5 rounded-full">
            ✓ Erledigt
          </span>
        )}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div
          className={`h-1.5 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="0.5"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={`Wert in ${typeLabel}`}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={saving || value === ''}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '...' : saved ? 'Gespeichert!' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
