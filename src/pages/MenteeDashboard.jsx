import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import TaskCard from '../components/TaskCard'
import WeeklyOverview from '../components/WeeklyOverview'

export default function MenteeDashboard() {
  const { user, profile, signOut } = useAuth()
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState({})
  const [activeTab, setActiveTab] = useState('heute')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchTasks()
    fetchTodayLogs()
  }, [])

  async function fetchTasks() {
    const { data: hidden } = await supabase
      .from('task_hidden')
      .select('task_id')
      .eq('mentee_id', user.id)

    const hiddenIds = (hidden ?? []).map(h => h.task_id)

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    setTasks((data ?? []).filter(t => !hiddenIds.includes(t.id)))
  }

  async function fetchTodayLogs() {
    const { data } = await supabase
      .from('task_logs')
      .select('*')
      .eq('mentee_id', user.id)
      .eq('date', today)

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

  const completedCount = tasks.filter(t => logs[t.id]?.value >= t.target_value).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Meine Aufgaben</h1>
          <p className="text-sm text-gray-500">{profile?.name} · {today}</p>
        </div>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
          Abmelden
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {[{ id: 'heute', label: 'Heute' }, { id: 'woche', label: 'Diese Woche' }].map(tab => (
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

        {activeTab === 'heute' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">Heute erledigt</span>
              <span className="text-blue-800 font-bold">{completedCount} / {tasks.length}</span>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Keine Aufgaben zugewiesen.</p>
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
