import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, LangToggle } from '../contexts/LanguageContext'
import TaskForm from '../components/TaskForm'
import MenteeOverview from '../components/MenteeOverview'
import MenteeForm from '../components/MenteeForm'
import MenteeEditForm from '../components/MenteeEditForm'
import MenteeWeeklyTable from '../components/MenteeWeeklyTable'
import Legend from '../components/Legend'
import { getTaskOptions } from '../lib/taskOptions'

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()
  const [tasks, setTasks] = useState([])
  const [mentees, setMentees] = useState([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showMenteeForm, setShowMenteeForm] = useState(false)
  const [editingMentee, setEditingMentee] = useState(null)
  const [activeTab, setActiveTab] = useState('aufgaben')

  const TABS = [
    { id: 'aufgaben', label: t('tab_tasks') },
    { id: 'mentees', label: t('tab_mentees') },
    { id: 'uebersicht', label: t('tab_overview') },
    { id: 'tabelle', label: t('tab_table') },
  ]

  useEffect(() => { fetchTasks(); fetchMentees() }, [])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data ?? [])
  }

  async function fetchMentees() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'mentee').order('name')
    setMentees(data ?? [])
  }

  async function deleteTask(id) {
    if (!confirm(t('delete') + '?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  function typeLabel(type) {
    return type === 'minutes' ? t('type_minutes') : t('type_pages')
  }

  function formatTaskTargets(task) {
    const opts = getTaskOptions(task)
    if (opts.length === 0) return ''
    return opts.map(o => `${o.target} ${typeLabel(o.type)}`).join(' / ')
  }

  function getUsername(email) {
    return email?.replace('@mentoren-plattform.intern', '') ?? email
  }

  async function deleteMentee(mentee) {
    if (!confirm(`${mentee.name} ${t('delete_confirm')}`)) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-mentee`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'delete', menteeId: mentee.id }),
      }
    )
    const result = await res.json()
    if (!res.ok || result.error) { alert(result.error ?? 'Fehler'); return }
    fetchMentees()
  }

  const btnPrimary = 'bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-all'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{t('platform')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Admin: {profile?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            {t('logout')}
          </button>
        </div>
      </header>

      <div className={`${activeTab === 'tabelle' ? 'max-w-none' : 'max-w-4xl'} mx-auto px-4 py-6`}>
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

        {activeTab === 'aufgaben' && (
          <div>
            <div className="mb-5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
              <svg viewBox="0 0 800 180" className="w-full h-32 md:h-40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <radialGradient id="sun" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </radialGradient>
                </defs>
                <circle cx="700" cy="50" r="34" fill="url(#sun)" />
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
                  Aufgaben? Kein Problem!
                </text>
                <text x="365" y="108" fontFamily="system-ui, sans-serif" fontSize="14" fill="#64748b">
                  Heute schon jemanden zum Abhaken motiviert?
                </text>
                <text x="365" y="138" fontFamily="system-ui, sans-serif" fontSize="13" fontStyle="italic" fill="#f59e0b">
                  Tipp: Ein neuer Eintrag kann nicht schaden.
                </text>
              </svg>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">{t('all_tasks')}</h2>
              <button onClick={() => { setEditingTask(null); setShowTaskForm(true) }} className={btnPrimary}>
                {t('new_task')}
              </button>
            </div>

            {showTaskForm && (
              <div className="mb-4">
                <TaskForm
                  task={editingTask}
                  onSaved={() => { setShowTaskForm(false); setEditingTask(null); fetchTasks() }}
                  onCancel={() => { setShowTaskForm(false); setEditingTask(null) }}
                />
              </div>
            )}

            <div className="space-y-2">
              {tasks.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-10">{t('no_tasks')}</p>
              )}
              {tasks.map(task => (
                <div key={task.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{task.title}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{t('goal')}: {formatTaskTargets(task)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingTask(task); setShowTaskForm(true) }} className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      {t('edit')}
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mentees' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">{t('mentees_count')} ({mentees.length})</h2>
              <button onClick={() => { setEditingMentee(null); setShowMenteeForm(true) }} className={btnPrimary}>
                {t('add_mentee')}
              </button>
            </div>

            {showMenteeForm && (
              <div className="mb-4">
                <MenteeForm
                  onSaved={() => { setShowMenteeForm(false); fetchMentees() }}
                  onCancel={() => setShowMenteeForm(false)}
                />
              </div>
            )}

            <div className="space-y-2">
              {mentees.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-10">{t('no_mentees')}</p>
              )}
              {mentees.map(mentee => (
                <div key={mentee.id}>
                  {editingMentee?.id === mentee.id ? (
                    <MenteeEditForm
                      mentee={mentee}
                      onSaved={() => { setEditingMentee(null); fetchMentees() }}
                      onCancel={() => setEditingMentee(null)}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{mentee.name}</p>
                        <p className="text-sm text-slate-400">@{getUsername(mentee.email)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setShowMenteeForm(false); setEditingMentee(mentee) }} className="text-sm text-amber-600 hover:text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                          {t('edit')}
                        </button>
                        <button onClick={() => deleteMentee(mentee)} className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'uebersicht' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">{t('overview_today')}</h2>
              <button onClick={() => { setActiveTab('mentees'); setShowMenteeForm(true) }} className={btnPrimary}>
                {t('add_mentee')}
              </button>
            </div>
            <MenteeOverview
              mentees={mentees}
              tasks={tasks}
              onInvite={() => { setActiveTab('mentees'); setShowMenteeForm(true) }}
            />
          </div>
        )}

        {activeTab === 'tabelle' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">{t('table_overview_title')}</h2>
            </div>
            <Legend editable currentUserId={profile?.id} />
            <MenteeWeeklyTable mentees={mentees} tasks={tasks} />
          </div>
        )}

      </div>
    </div>
  )
}
