import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

export default function MenteeTaskVisibility({ mentee, tasks, onClose }) {
  const { t } = useLanguage()
  const [hiddenIds, setHiddenIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('task_hidden').select('task_id').eq('mentee_id', mentee.id).then(({ data }) => {
      setHiddenIds(new Set((data ?? []).map(r => r.task_id)))
    })
  }, [mentee.id])

  async function toggleTask(taskId) {
    setSaving(true)
    if (hiddenIds.has(taskId)) {
      await supabase.from('task_hidden').delete().eq('task_id', taskId).eq('mentee_id', mentee.id)
      setHiddenIds(prev => { const s = new Set(prev); s.delete(taskId); return s })
    } else {
      await supabase.from('task_hidden').insert({ task_id: taskId, mentee_id: mentee.id })
      setHiddenIds(prev => new Set([...prev, taskId]))
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">{mentee.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t('tasks_toggle')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition-colors">×</button>
        </div>

        <div className="px-6 py-4 space-y-2 max-h-96 overflow-y-auto">
          {tasks.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">{t('no_tasks_modal')}</p>
          )}
          {tasks.map(task => {
            const isHidden = hiddenIds.has(task.id)
            const typeShort = task.type === 'minutes' ? t('type_minutes_short') : t('type_pages_short')
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                disabled={saving}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all disabled:opacity-60 ${
                  isHidden ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-green-50 border-green-200 text-slate-800'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t('goal')}: {task.target_value} {typeShort}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isHidden ? 'bg-slate-200 text-slate-500' : 'bg-green-200 text-green-700'
                }`}>
                  {isHidden ? t('hidden') : t('visible')}
                </span>
              </button>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full bg-slate-800 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-900 transition-colors">
            {t('done_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}
