import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import { getTaskOptions, resolveLogType } from '../lib/taskOptions'

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
  const { t } = useLanguage()
  // Map: task.id -> { pages: total, minutes: total }
  const [weeklyTotals, setWeeklyTotals] = useState({})

  useEffect(() => {
    if (!userId || tasks.length === 0) return
    fetchWeeklyLogs()
  }, [userId, tasks])

  async function fetchWeeklyLogs() {
    const { data } = await supabase
      .from('task_logs')
      .select('task_id, value, type')
      .eq('mentee_id', userId)
      .in('date', weekDates)
    const totals = {}
    for (const log of data ?? []) {
      const task = tasks.find(t => t.id === log.task_id)
      const type = resolveLogType(task, log)
      if (!type) continue
      if (!totals[log.task_id]) totals[log.task_id] = { pages: 0, minutes: 0 }
      totals[log.task_id][type] += Number(log.value)
    }
    setWeeklyTotals(totals)
  }

  if (tasks.length === 0) return null

  const weekStart = weekDates[0].slice(5).replace('-', '.')
  const weekEnd = weekDates[6].slice(5).replace('-', '.')

  function shortLabel(type) {
    return type === 'minutes' ? t('type_minutes_short') : t('type_pages_short')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-slate-800">{t('this_week')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{weekStart} – {weekEnd} · {daysElapsed} {t('of_7_days')}</p>
        </div>
      </div>

      <div className="space-y-5">
        {tasks.map(task => {
          const options = getTaskOptions(task)
          const totals = weeklyTotals[task.id] ?? { pages: 0, minutes: 0 }

          return (
            <div key={task.id}>
              <p className="text-sm font-medium text-slate-700 mb-2">{task.title}</p>
              <div className="space-y-3">
                {options.map(opt => {
                  const total = totals[opt.type] ?? 0
                  const weeklyGoal = opt.target * 7
                  const partialGoal = opt.target * daysElapsed
                  const progress = Math.min((total / weeklyGoal) * 100, 100)
                  const onTrack = total >= partialGoal
                  const typeShort = shortLabel(opt.type)
                  return (
                    <div key={opt.type}>
                      <div className="flex items-end justify-between mb-1.5">
                        <span className="text-xs text-slate-500">
                          {opt.type === 'minutes' ? t('type_minutes') : t('type_pages')}
                        </span>
                        <span className="text-sm text-slate-500">
                          <span className={`font-bold ${onTrack ? 'text-green-600' : 'text-slate-800'}`}>{total}</span>
                          {' / '}{weeklyGoal} {typeShort}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${onTrack ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {onTrack
                          ? `${t('on_track')} · ${t('daily_goal')} ${opt.target} ${typeShort}`
                          : `${t('daily_goal')} ${opt.target} ${typeShort} · ${t('expected_today')} ${partialGoal}`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
