import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

const todayStr = new Date().toISOString().split('T')[0]
const weekDates = getWeekDates()
const daysElapsed = weekDates.filter(d => d <= todayStr).length

export default function WeeklyOverview({ userId, tasks }) {
  const [weeklyTotals, setWeeklyTotals] = useState({})

  useEffect(() => {
    if (!userId || tasks.length === 0) return
    fetchWeeklyLogs()
  }, [userId, tasks])

  async function fetchWeeklyLogs() {
    const { data } = await supabase
      .from('task_logs')
      .select('task_id, value')
      .eq('mentee_id', userId)
      .in('date', weekDates)

    const totals = {}
    for (const log of data ?? []) {
      totals[log.task_id] = (totals[log.task_id] ?? 0) + log.value
    }
    setWeeklyTotals(totals)
  }

  if (tasks.length === 0) return null

  const weekStart = weekDates[0].slice(5).replace('-', '.')
  const weekEnd = weekDates[6].slice(5).replace('-', '.')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Diese Woche</h2>
          <p className="text-xs text-gray-400">{weekStart} – {weekEnd} · {daysElapsed} von 7 Tagen</p>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map(task => {
          const total = weeklyTotals[task.id] ?? 0
          const weeklyGoal = task.target_value * 7
          const partialGoal = task.target_value * daysElapsed
          const progress = Math.min((total / weeklyGoal) * 100, 100)
          const onTrack = total >= partialGoal
          const typeLabel = task.type === 'minutes' ? 'Min.' : 'Seiten'

          return (
            <div key={task.id}>
              <div className="flex items-end justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{task.title}</span>
                <span className="text-sm text-gray-500">
                  <span className={`font-bold ${onTrack ? 'text-green-600' : 'text-gray-800'}`}>
                    {total}
                  </span>
                  {' / '}{weeklyGoal} {typeLabel}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${onTrack ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {onTrack
                  ? `Auf Kurs · Ziel pro Tag: ${task.target_value} ${typeLabel}`
                  : `Ziel pro Tag: ${task.target_value} ${typeLabel} · erwartet bis heute: ${partialGoal}`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
