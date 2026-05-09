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
      <header className="bg-white border-b border-slate-200 shadow-sm px-3 sm:px-6 py-4 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-slate-800 truncate">{t('platform')}</h1>
          <p className="text-xs text-slate-400 mt-0.5 truncate">Admin: {profile?.name}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
                <div key={task.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 break-words">{task.title}</p>
                    <p className="text-sm text-slate-400 mt-0.5 break-words">{t('goal')}: {formatTaskTargets(task)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
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
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 break-words">{mentee.name}</p>
                        <p className="text-sm text-slate-400 break-words">@{getUsername(mentee.email)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
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
