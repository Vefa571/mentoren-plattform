import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export default function TaskForm({ task, onSaved, onCancel }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [title, setTitle] = useState(task?.title ?? '')

  const initialPages = task?.target_pages ?? (task?.type === 'pages' ? task?.target_value : null)
  const initialMinutes = task?.target_minutes ?? (task?.type === 'minutes' ? task?.target_value : null)

  // Bei neuer Aufgabe Seiten standardmäßig aktiv. Beim Bearbeiten exakt das übernehmen, was gespeichert ist.
  const [pagesEnabled, setPagesEnabled] = useState(task ? initialPages != null : true)
  const [minutesEnabled, setMinutesEnabled] = useState(initialMinutes != null)
  const [pagesValue, setPagesValue] = useState(initialPages ?? '')
  const [minutesValue, setMinutesValue] = useState(initialMinutes ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError(t('task_form_error')); return }
    if (!pagesEnabled && !minutesEnabled) { setError(t('task_form_error_no_target')); return }

    let pagesNum = null
    let minutesNum = null
    if (pagesEnabled) {
      pagesNum = parseFloat(pagesValue)
      if (isNaN(pagesNum) || pagesNum <= 0) { setError(t('task_form_error')); return }
    }
    if (minutesEnabled) {
      minutesNum = parseFloat(minutesValue)
      if (isNaN(minutesNum) || minutesNum <= 0) { setError(t('task_form_error')); return }
    }

    // Legacy-Spalten füllen, wenn nur ein Typ aktiv ist (für Altcode-Verträglichkeit)
    let legacyType = null
    let legacyTarget = null
    if (pagesEnabled && !minutesEnabled) { legacyType = 'pages'; legacyTarget = pagesNum }
    else if (minutesEnabled && !pagesEnabled) { legacyType = 'minutes'; legacyTarget = minutesNum }

    const payload = {
      title: title.trim(),
      type: legacyType,
      target_value: legacyTarget,
      target_pages: pagesNum,
      target_minutes: minutesNum,
    }

    setSaving(true)
    let dbError = null
    if (task) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', task.id)
      dbError = error
    } else {
      const { error } = await supabase.from('tasks').insert({ ...payload, created_by: user.id })
      dbError = error
    }
    setSaving(false)
    if (dbError) setError(dbError.message)
    else onSaved()
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400'

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
      <h3 className="font-semibold text-slate-800 mb-4">{task ? t('edit_task') : t('new_task_label')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('task_title')}</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('task_placeholder')} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('task_targets')}</label>
          <p className="text-xs text-slate-500 mb-2">{t('task_targets_hint')}</p>

          <div className="space-y-2">
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${pagesEnabled ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
              <input
                type="checkbox"
                id="pagesEnabled"
                checked={pagesEnabled}
                onChange={e => setPagesEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="pagesEnabled" className="text-sm font-medium text-slate-700 w-20 cursor-pointer">
                {t('type_pages')}
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={pagesValue}
                onChange={e => setPagesValue(e.target.value)}
                placeholder="z.B. 5"
                disabled={!pagesEnabled}
                className={inputClass}
              />
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${minutesEnabled ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
              <input
                type="checkbox"
                id="minutesEnabled"
                checked={minutesEnabled}
                onChange={e => setMinutesEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="minutesEnabled" className="text-sm font-medium text-slate-700 w-20 cursor-pointer">
                {t('type_minutes')}
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={minutesValue}
                onChange={e => setMinutesValue(e.target.value)}
                placeholder="z.B. 12"
                disabled={!minutesEnabled}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-all">
            {saving ? t('saving') : t('save')}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
