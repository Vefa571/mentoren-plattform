import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, LangToggle } from '../contexts/LanguageContext'
import TaskForm from '../components/TaskForm'
import MenteeOverview from '../components/MenteeOverview'
import MenteeForm from '../components/MenteeForm'
import MenteeEditForm from '../components/MenteeEditForm'

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

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [historyLogs, setHistoryLogs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const TABS = [
    { id: 'aufgaben', label: t('tab_tasks') },
    { id: 'mentees', label: t('tab_mentees') },
    { id: 'uebersicht', label: t('tab_overview') },
    { id: 'verlauf', label: t('tab_history') },
  ]

  useEffect(() => { fetchTasks(); fetchMentees() }, [])
  useEffect(() => { if (activeTab === 'verlauf') fetchHistoryLogs() }, [activeTab, selectedDate])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data ?? [])
  }

  async function fetchMentees() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'mentee').order('name')
    setMentees(data ?? [])
  }

  async function fetchHistoryLogs() {
    setHistoryLoading(true)
    const { data } = await supabase.from('task_logs').select('*').eq('date', selectedDate)
    setHistoryLogs(data ?? [])
    setHistoryLoading(false)
  }

  async function deleteTask(id) {
    if (!confirm(t('delete') + '?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  function typeLabel(type) {
    return type === 'minutes' ? t('type_minutes') : t('type_pages')
  }

  function typeLabelShort(type) {
    return type === 'minutes' ? t('type_minutes_short') : t('type_pages_short')
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

  function getHistoryLog(menteeId, taskId) {
    return historyLogs.find(l => l.mentee_id === menteeId && l.task_id === taskId)
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const btnPrimary = 'bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-all'
  const btnGhost = 'px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors'

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

      <div className="max-w-4xl mx-auto px-4 py-6">
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
                <div key={task.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{task.title}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{t('goal')}: {task.target_value} {typeLabel(task.type)}</p>
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

        {activeTab === 'verlauf' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-base font-semibold text-slate-800">{t('tab_history')}</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              />
            </div>

            {historyLoading ? (
              <p className="text-slate-400 text-sm text-center py-10">{t('loading')}</p>
            ) : mentees.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">{t('no_mentees')}</p>
            ) : (
              <div className="space-y-3">
                {mentees.map(mentee => {
                  const doneTasks = tasks.filter(t2 => {
                    const log = getHistoryLog(mentee.id, t2.id)
                    return log?.value >= t2.target_value
                  })
                  return (
                    <div key={mentee.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-slate-800">{mentee.name}</p>
                          <p className="text-xs text-slate-400">@{getUsername(mentee.email)}</p>
                        </div>
                        <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                          {doneTasks.length}/{tasks.length} {t('done_count')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tasks.map(task => {
                          const log = getHistoryLog(mentee.id, task.id)
                          const progress = log ? Math.min((log.value / task.target_value) * 100, 100) : 0
                          const isDone = log?.value >= task.target_value
                          return (
                            <div key={task.id} className={`rounded-xl px-3 py-2.5 border ${isDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-slate-700 truncate">{task.title}</span>
                                <span className="text-xs text-slate-500 ml-2 shrink-0">
                                  {log ? log.value : '–'}/{task.target_value} {typeLabelShort(task.type)}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1">
                                <div className={`h-1 rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-400'}`} style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
