import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, LangToggle } from '../contexts/LanguageContext'
import TaskCard from '../components/TaskCard'
import WeeklyOverview from '../components/WeeklyOverview'

export default function MenteeDashboard() {
  const { user, profile, signOut } = useAuth()
  const { t } = useLanguage()
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState({})
  const [activeTab, setActiveTab] = useState('heute')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchTasks(); fetchTodayLogs() }, [])

  async function fetchTasks() {
    const { data: hidden } = await supabase.from('task_hidden').select('task_id').eq('mentee_id', user.id)
    const hiddenIds = (hidden ?? []).map(h => h.task_id)
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks((data ?? []).filter(t => !hiddenIds.includes(t.id)))
  }

  async function fetchTodayLogs() {
    const { data } = await supabase.from('task_logs').select('*').eq('mentee_id', user.id).eq('date', today)
    const map = {}
    for (const log of data ?? []) map[log.task_id] = log
    setLogs(map)
  }

  async function handleLogSave(taskId, value) {
    const existing = logs[taskId]
    if (existing) {
      await supabase.from('task_logs').update({ value }).eq('id', existing.id)
    } else {
      await supabase.from('task_logs').insert({ task_id: taskId, mentee_id: user.id, date: today, value })
    }
    fetchTodayLogs()
  }

  const completedCount = tasks.filter(task => logs[task.id]?.value >= task.target_value).length

  const TABS = [
    { id: 'heute', label: t('tab_today') },
    { id: 'woche', label: t('tab_week') },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{t('my_tasks')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{profile?.name} · {today}</p>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            {t('logout')}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-1.5 mb-6 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'heute' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 mb-5 flex items-center justify-between shadow-sm">
              <span className="text-sm text-blue-700 font-medium">{t('today_done')}</span>
              <span className="text-blue-800 font-bold text-lg">{completedCount} / {tasks.length}</span>
            </div>
            <div className="space-y-3">
              {tasks.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-10">{t('no_tasks_assigned')}</p>
              )}
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  log={logs[task.id]}
                  onSave={(value) => handleLogSave(task.id, value)}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === 'woche' && (
          <WeeklyOverview userId={user.id} tasks={tasks} />
        )}
      </div>
    </div>
  )
}
