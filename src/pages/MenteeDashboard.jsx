import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, LangToggle } from '../contexts/LanguageContext'
import TaskCard from '../components/TaskCard'
import WeeklyOverview from '../components/WeeklyOverview'
import Legend from '../components/Legend'

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

  async function handleLogSave(taskId, value, type) {
    const existing = logs[taskId]
    if (existing) {
      await supabase.from('task_logs').update({ value, type }).eq('id', existing.id)
    } else {
      await supabase.from('task_logs').insert({ task_id: taskId, mentee_id: user.id, date: today, value, type })
    }
    fetchTodayLogs()
  }

  const completedCount = tasks.filter(task => {
    const log = logs[task.id]
    if (!log) return false
    const logType = log.type ?? task.type
    const target = logType === 'pages'
      ? (task.target_pages ?? task.target_value)
      : (task.target_minutes ?? task.target_value)
    return target != null && log.value >= Number(target)
  }).length

  const TABS = [
    { id: 'heute', label: t('tab_today') },
    { id: 'woche', label: t('tab_week') },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm px-3 sm:px-6 py-4 flex items-center justify-between">
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
            <div className="mb-5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
              <svg viewBox="0 0 800 180" className="w-full h-32 md:h-40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <radialGradient id="sun-mentee" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </radialGradient>
                </defs>
                <circle cx="700" cy="50" r="34" fill="url(#sun-mentee)" />
                <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
                  <line x1="700" y1="0" x2="700" y2="10" />
                  <line x1="700" y1="90" x2="700" y2="100" />
                  <line x1="650" y1="50" x2="660" y2="50" />
                  <line x1="740" y1="50" x2="750" y2="50" />
                  <line x1="665" y1="15" x2="672" y2="22" />
                  <line x1="728" y1="78" x2="735" y2="85" />
                  <line x1="735" y1="15" x2="728" y2="22" />
                  <line x1="672" y1="78" x2="665" y2="85" />
                </g>

                <g transform="translate(70 35)">
                  <ellipse cx="55" cy="125" rx="48" ry="6" fill="#000" opacity="0.08" />
                  <rect x="20" y="40" width="70" height="80" rx="35" fill="#fcd34d" />
                  <rect x="15" y="75" width="20" height="35" rx="10" fill="#fcd34d" />
                  <rect x="75" y="75" width="20" height="35" rx="10" fill="#fcd34d" />
                  <circle cx="55" cy="30" r="32" fill="#fde68a" />
                  <circle cx="44" cy="28" r="7" fill="#fff" />
                  <circle cx="66" cy="28" r="7" fill="#fff" />
                  <circle cx="46" cy="30" r="3.5" fill="#1f2937" />
                  <circle cx="68" cy="30" r="3.5" fill="#1f2937" />
                  <path d="M 42 42 Q 55 52 68 42" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <circle cx="35" cy="38" r="4" fill="#fda4af" opacity="0.6" />
                  <circle cx="75" cy="38" r="4" fill="#fda4af" opacity="0.6" />
                </g>

                <g transform="translate(195 45)">
                  <rect x="0" y="0" width="110" height="130" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
                  <rect x="35" y="-8" width="40" height="16" rx="4" fill="#94a3b8" />
                  <rect x="42" y="-12" width="26" height="10" rx="3" fill="#64748b" />
                  <line x1="15" y1="25" x2="95" y2="25" stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1="15" y1="50" x2="95" y2="50" stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1="15" y1="75" x2="95" y2="75" stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1="15" y1="100" x2="95" y2="100" stroke="#e2e8f0" strokeWidth="1.5" />
                  <path d="M 18 22 l 4 5 l 8 -10" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 18 47 l 4 5 l 8 -10" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 18 72 l 4 5 l 8 -10" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="22" cy="100" r="5" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                </g>

                <g fill="#fbbf24">
                  <path d="M 340 40 l 3 8 l 8 3 l -8 3 l -3 8 l -3 -8 l -8 -3 l 8 -3 z" />
                  <path d="M 420 110 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 l 6 -2 z" />
                  <path d="M 590 130 l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 l 5 -2 z" />
                </g>

                <text x="365" y="80" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="700" fill="#1e293b">
                  {t('banner_mentee_title')}
                </text>
                <text x="365" y="108" fontFamily="system-ui, sans-serif" fontSize="14" fill="#64748b">
                  {t('banner_mentee_sub')}
                </text>
                <text x="365" y="138" fontFamily="system-ui, sans-serif" fontSize="13" fontStyle="italic" fill="#f59e0b">
                  {t('banner_mentee_tip')}
                </text>
              </svg>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 mb-5 flex items-center justify-between shadow-sm">
              <span className="text-sm text-blue-700 font-medium">{t('today_done')}</span>
              <span className="text-blue-800 font-bold text-lg">{completedCount} / {tasks.length}</span>
            </div>
            <div className="mb-5">
              <Legend />
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
                  onSave={(value, type) => handleLogSave(task.id, value, type)}
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
