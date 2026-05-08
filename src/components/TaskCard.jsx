import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { getTaskOptions } from '../lib/taskOptions'

export default function TaskCard({ task, log, onSave }) {
  const { t } = useLanguage()
  const options = getTaskOptions(task)
  const dual = options.length === 2

  const initialType = log?.type ?? options[0]?.type ?? 'pages'
  const [selectedType, setSelectedType] = useState(initialType)

  const initialValue = log && log.type === initialType
    ? log.value
    : (log && !log.type && initialType === task.type ? log.value : 0)
  const [value, setValue] = useState(String(initialValue ?? 0))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleTypeChange(nextType) {
    if (nextType === selectedType) return
    setSelectedType(nextType)
    setValue(String(log && log.type === nextType ? log.value : 0))
    setSaved(false)
  }

  const activeOption = options.find(o => o.type === selectedType) ?? options[0]
  const target = activeOption?.target ?? 1
  const numericValue = Number(value) || 0
  const progress = Math.min((numericValue / target) * 100, 100)
  const done = numericValue >= target
  const exceeded = numericValue > target
  const remaining = Math.max(target - numericValue, 0)
  const overshoot = Math.max(numericValue - target, 0)
  const typeLabel = selectedType === 'minutes' ? t('type_minutes_short') : t('type_pages_short')

  async function handleSave() {
    setSaving(true)
    await onSave(numericValue, selectedType)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function formatPlaceholder(n, unit) {
    return t('remaining_to_goal').replace('{n}', n).replace('{unit}', unit)
  }

  function formatExceeded(n, unit) {
    return t('exceeded_goal').replace('{n}', n).replace('{unit}', unit)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm px-5 py-4 transition-all ${done ? 'border-green-300' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="font-semibold text-slate-800">{task.title}</p>
        {dual && (
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
            {options.map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleTypeChange(opt.type)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedType === opt.type
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.type === 'minutes' ? t('type_minutes') : t('type_pages')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fortschrittsbalken */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500">{t('progress')}</span>
          <span className={`text-xs font-bold tracking-wide ${done ? 'text-green-600' : 'text-slate-700'}`}>
            {done ? `✓ ${t('completed_label')}` : `${Math.round(progress)} %`}
          </span>
        </div>
        <div className={`relative w-full bg-slate-100 rounded-full h-3 overflow-hidden ${done ? 'ring-2 ring-green-200' : ''}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              done ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Eingabe */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <label className="text-xs font-medium text-slate-500">{t('enter_value')}</label>
          <span className="text-sm text-slate-400">{typeLabel} · {t('goal')}: {target}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={value}
            onChange={e => { setValue(e.target.value); setSaved(false) }}
            className={`w-full text-2xl font-bold rounded-xl border px-4 py-2.5 outline-none transition-colors ${
              done
                ? 'border-green-300 bg-green-50 text-green-700 focus:border-green-500'
                : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500'
            }`}
          />
          <span className="text-sm text-slate-400 whitespace-nowrap">{typeLabel}</span>
        </div>
        <p className={`text-xs mt-2 ${exceeded ? 'text-green-600' : done ? 'text-green-600' : 'text-slate-500'}`}>
          {exceeded
            ? formatExceeded(overshoot, typeLabel)
            : done
              ? `✓ ${t('completed_label')}`
              : formatPlaceholder(remaining, typeLabel)}
        </p>
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
