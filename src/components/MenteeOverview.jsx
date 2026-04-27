import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import MenteeTaskVisibility from './MenteeTaskVisibility'

function getUsername(email) {
  return email?.replace('@mentoren-plattform.intern', '') ?? email
}

export default function MenteeOverview({ mentees, tasks, onInvite }) {
  const { t } = useLanguage()
  const [logs, setLogs] = useState([])
  const [managingMentee, setManagingMentee] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchTodayLogs() }, [])

  async function fetchTodayLogs() {
    const { data } = await supabase.from('task_logs').select('*').eq('date', today)
    setLogs(data ?? [])
  }

  function getLog(menteeId, taskId) {
    return logs.find(l => l.mentee_id === menteeId && l.task_id === taskId)
  }

  if (mentees.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm mb-4">{t('no_mentees_empty')}</p>
        {onInvite && (
          <button onClick={onInvite} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all">
            {t('add_mentee')}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {managingMentee && (
        <MenteeTaskVisibility mentee={managingMentee} tasks={tasks} onClose={() => setManagingMentee(null)} />
      )}
      <div className="space-y-3">
        {mentees.map(mentee => {
          const menteeTaskLogs = tasks.map(task => ({ task, log: getLog(mentee.id, task.id) }))
          const done = menteeTaskLogs.filter(({ task, log }) => log?.value >= task.target_value).length

          return (
            <div key={mentee.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{mentee.name}</p>
                  <p className="text-xs text-slate-400">@{getUsername(mentee.email)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setManagingMentee(mentee)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    {t('tab_tasks')}
                  </button>
                  <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {done}/{tasks.length} {t('done_count')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tasks.map(task => {
                  const log = getLog(mentee.id, task.id)
                  const progress = log ? Math.min((log.value / task.target_value) * 100, 100) : 0
                  const isDone = log?.value >= task.target_value
                  const typeShort = task.type === 'minutes' ? t('type_minutes_short') : t('type_pages_short')
                  return (
                    <div key={task.id} className={`rounded-xl px-3 py-2.5 border ${isDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-slate-700 truncate">{task.title}</span>
                        <span className="text-xs text-slate-500 ml-2 shrink-0">
                          {log ? log.value : '–'}/{task.target_value} {typeShort}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-400'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
