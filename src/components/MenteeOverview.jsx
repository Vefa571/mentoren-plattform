import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MenteeTaskVisibility from './MenteeTaskVisibility'

export default function MenteeOverview({ mentees, tasks, onInvite }) {
  const [logs, setLogs] = useState([])
  const [managingMentee, setManagingMentee] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchTodayLogs()
  }, [])

  async function fetchTodayLogs() {
    const { data } = await supabase
      .from('task_logs')
      .select('*')
      .eq('date', today)
    setLogs(data ?? [])
  }

  function getLog(menteeId, taskId) {
    return logs.find(l => l.mentee_id === menteeId && l.task_id === taskId)
  }

  function typeLabel(type) {
    return type === 'minutes' ? 'Min.' : 'S.'
  }

  if (mentees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm mb-4">Noch keine Mentees eingeladen.</p>
        {onInvite && (
          <button
            onClick={onInvite}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Mentee anlegen
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {managingMentee && (
        <MenteeTaskVisibility
          mentee={managingMentee}
          tasks={tasks}
          onClose={() => setManagingMentee(null)}
        />
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Übersicht heute ({today})</h2>
        {mentees.map(mentee => {
          const menteeTaskLogs = tasks.map(task => ({
            task,
            log: getLog(mentee.id, task.id)
          }))
          const done = menteeTaskLogs.filter(({ task, log }) => log?.value >= task.target_value).length

          return (
            <div key={mentee.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">{mentee.name}</p>
                  <p className="text-xs text-gray-400">{mentee.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setManagingMentee(mentee)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Aufgaben
                  </button>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {done}/{tasks.length} erledigt
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tasks.map(task => {
                  const log = getLog(mentee.id, task.id)
                  const progress = log ? Math.min((log.value / task.target_value) * 100, 100) : 0
                  const isDone = log?.value >= task.target_value

                  return (
                    <div key={task.id} className={`rounded-lg px-3 py-2 border ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate">{task.title}</span>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">
                          {log ? log.value : '–'}/{task.target_value} {typeLabel(task.type)}
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
    </>
  )
}
