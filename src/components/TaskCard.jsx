import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function TaskCard({ task, log, onSave }) {
  const { t } = useLanguage()
  const [value, setValue] = useState(log?.value ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const max = task.target_value * 2
  const progress = Math.min((value / task.target_value) * 100, 100)
  const done = value >= task.target_value
  const typeLabel = task.type === 'minutes' ? t('type_minutes_short') : t('type_pages_short')

  async function handleSave() {
    setSaving(true)
    await onSave(Number(value))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm px-5 py-4 transition-all ${done ? 'border-green-300' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-800">{task.title}</p>
          <p className="text-sm text-slate-400 mt-0.5">{t('goal')}: {task.target_value} {typeLabel}</p>
        </div>
        {done && (
          <span className="text-green-600 text-xs font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            {t('task_done_badge')}
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-slate-800">{value}</span>
          <span className="text-sm text-slate-400">{typeLabel} {t('goal').toLowerCase()} {task.target_value}</span>
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
            background: `linear-gradient(to right, ${done ? '#22c55e' : '#3b82f6'} ${progress}%, #e2e8f0 ${progress}%)`
          }}
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>0</span>
          <span className={`font-semibold ${done ? 'text-green-500' : 'text-blue-500'}`}>
            {t('goal')}: {task.target_value}
          </span>
          <span>{max}</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
        }`}
      >
        {saving ? t('saving') : saved ? t('saved') : t('save')}
      </button>
    </div>
  )
}
