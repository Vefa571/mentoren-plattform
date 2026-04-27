import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MenteeTaskVisibility({ mentee, tasks, onClose }) {
  const [hiddenIds, setHiddenIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('task_hidden')
      .select('task_id')
      .eq('mentee_id', mentee.id)
      .then(({ data }) => {
        setHiddenIds(new Set((data ?? []).map(r => r.task_id)))
      })
  }, [mentee.id])

  async function toggleTask(taskId) {
    setSaving(true)
    if (hiddenIds.has(taskId)) {
      await supabase
        .from('task_hidden')
        .delete()
        .eq('task_id', taskId)
        .eq('mentee_id', mentee.id)
      setHiddenIds(prev => { const s = new Set(prev); s.delete(taskId); return s })
    } else {
      await supabase
        .from('task_hidden')
        .insert({ task_id: taskId, mentee_id: mentee.id })
      setHiddenIds(prev => new Set([...prev, taskId]))
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">{mentee.name}</p>
            <p className="text-xs text-gray-400">Aufgaben ein-/ausblenden</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-4 space-y-2 max-h-96 overflow-y-auto">
          {tasks.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Keine Aufgaben vorhanden.</p>
          )}
          {tasks.map(task => {
            const isHidden = hiddenIds.has(task.id)
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                disabled={saving}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors disabled:opacity-60 ${
                  isHidden
                    ? 'bg-gray-50 border-gray-200 text-gray-400'
                    : 'bg-green-50 border-green-200 text-gray-800'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ziel: {task.target_value} {task.type === 'minutes' ? 'Min.' : 'Seiten'}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isHidden ? 'bg-gray-200 text-gray-500' : 'bg-green-200 text-green-700'
                }`}>
                  {isHidden ? 'Ausgeblendet' : 'Sichtbar'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-800 text-white rounded-xl py-2 text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}
