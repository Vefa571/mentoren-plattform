import { useState } from 'react'

export default function TaskCard({ task, log, onSave }) {
  const [value, setValue] = useState(log?.value ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const max = task.target_value * 2
  const progress = Math.min((value / task.target_value) * 100, 100)
  const done = value >= task.target_value
  const typeLabel = task.type === 'minutes' ? 'Min.' : 'Seiten'

  async function handleSave() {
    setSaving(true)
    await onSave(Number(value))
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

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-2xl font-bold text-gray-800">{value}</span>
          <span className="text-sm text-gray-400">{typeLabel} von {task.target_value}</span>
        </div>
        <input
          type="range"
          min="0"
          max={max}
          step="1"
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${done ? '#22c55e' : '#3b82f6'} ${progress}%, #e5e7eb ${progress}%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span className={`font-medium ${done ? 'text-green-600' : 'text-blue-600'}`}>
            Ziel: {task.target_value}
          </span>
          <span>{max}</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
        }`}
      >
        {saving ? 'Speichern...' : saved ? '✓ Gespeichert' : 'Speichern'}
      </button>
    </div>
  )
}
