import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export default function TaskForm({ task, onSaved, onCancel }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [title, setTitle] = useState(task?.title ?? '')
  const [type, setType] = useState(task?.type ?? 'pages')
  const [targetValue, setTargetValue] = useState(task?.target_value ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const num = parseFloat(targetValue)
    if (!title.trim() || isNaN(num) || num <= 0) { setError(t('task_form_error')); return }

    setSaving(true)
    let dbError = null
    if (task) {
      const { error } = await supabase.from('tasks').update({ title: title.trim(), type, target_value: num }).eq('id', task.id)
      dbError = error
    } else {
      const { error } = await supabase.from('tasks').insert({ title: title.trim(), type, target_value: num, created_by: user.id })
      dbError = error
    }
    setSaving(false)
    if (dbError) setError(dbError.message)
    else onSaved()
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
      <h3 className="font-semibold text-slate-800 mb-4">{task ? t('edit_task') : t('new_task_label')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('task_title')}</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('task_placeholder')} className={inputClass} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('task_type')}</label>
            <select value={type} onChange={e => setType(e.target.value)} className={inputClass}>
              <option value="pages">{t('type_pages')}</option>
              <option value="minutes">{t('type_minutes')}</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('target_value')}</label>
            <input type="number" min="0.5" step="0.5" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="z.B. 5" className={inputClass} />
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
