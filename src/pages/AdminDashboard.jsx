import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import TaskForm from '../components/TaskForm'
import MenteeOverview from '../components/MenteeOverview'
import MenteeForm from '../components/MenteeForm'

const TABS = [
  { id: 'aufgaben', label: 'Aufgaben' },
  { id: 'mentees', label: 'Mentees' },
  { id: 'uebersicht', label: 'Übersicht' },
  { id: 'verlauf', label: 'Verlauf' },
]

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const [tasks, setTasks] = useState([])
  const [mentees, setMentees] = useState([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showMenteeForm, setShowMenteeForm] = useState(false)
  const [activeTab, setActiveTab] = useState('aufgaben')

  // Verlauf-State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [historyLogs, setHistoryLogs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchMentees()
  }, [])

  useEffect(() => {
    if (activeTab === 'verlauf') fetchHistoryLogs()
  }, [activeTab, selectedDate])

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
    const { data } = await supabase
      .from('task_logs')
      .select('*')
      .eq('date', selectedDate)
    setHistoryLogs(data ?? [])
    setHistoryLoading(false)
  }

  async function deleteTask(id) {
    if (!confirm('Aufgabe wirklich löschen?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  function typeLabel(type) {
    return type === 'minutes' ? 'Minuten' : 'Seiten'
  }

  function getHistoryLog(menteeId, taskId) {
    return historyLogs.find(l => l.mentee_id === menteeId && l.task_id === taskId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mentoren-Plattform</h1>
          <p className="text-sm text-gray-500">Admin: {profile?.name}</p>
        </div>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
          Abmelden
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'aufgaben' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Alle Aufgaben</h2>
              <button
                onClick={() => { setEditingTask(null); setShowTaskForm(true) }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + Neue Aufgabe
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

            <div className="space-y-3">
              {tasks.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Noch keine Aufgaben erstellt.</p>
              )}
              {tasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Ziel: {task.target_value} {typeLabel(task.type)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingTask(task); setShowTaskForm(true) }}
                      className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-sm text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Löschen
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
              <h2 className="text-lg font-semibold text-gray-800">Mentees ({mentees.length})</h2>
              <button
                onClick={() => setShowMenteeForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + Mentee einladen
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

            <div className="space-y-3">
              {mentees.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Noch keine Mentees angelegt.</p>
              )}
              {mentees.map(mentee => (
                <div key={mentee.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{mentee.name}</p>
                    <p className="text-sm text-gray-400">{mentee.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Mentee</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'uebersicht' && (
          <MenteeOverview mentees={mentees} tasks={tasks} />
        )}

        {activeTab === 'verlauf' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Verlauf</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {historyLoading ? (
              <p className="text-gray-400 text-sm text-center py-8">Laden...</p>
            ) : mentees.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Keine Mentees gefunden.</p>
            ) : (
              <div className="space-y-4">
                {mentees.map(mentee => {
                  const doneTasks = tasks.filter(t => {
                    const log = getHistoryLog(mentee.id, t.id)
                    return log?.value >= t.target_value
                  })

                  return (
                    <div key={mentee.id} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-800">{mentee.name}</p>
                          <p className="text-xs text-gray-400">{mentee.email}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          {doneTasks.length}/{tasks.length} erledigt
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tasks.map(task => {
                          const log = getHistoryLog(mentee.id, task.id)
                          const progress = log ? Math.min((log.value / task.target_value) * 100, 100) : 0
                          const isDone = log?.value >= task.target_value

                          return (
                            <div key={task.id} className={`rounded-lg px-3 py-2 border ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-700 truncate">{task.title}</span>
                                <span className="text-xs text-gray-500 ml-2 shrink-0">
                                  {log ? log.value : '–'}/{task.target_value} {task.type === 'minutes' ? 'Min.' : 'S.'}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                  className={`h-1 rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-400'}`}
                                  style={{ width: `${progress}%` }}
                                />
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
