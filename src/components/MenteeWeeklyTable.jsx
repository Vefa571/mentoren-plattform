import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import { resolveLogType } from '../lib/taskOptions'

function pad(n) { return String(n).padStart(2, '0') }

function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function defaultRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: toISO(start), end: toISO(end) }
}

// ISO-Wochen-Berechnung: liefert { year, week }
function getISOWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return { year: date.getUTCFullYear(), week }
}

function weekKey(yw) { return `${yw.year}-${pad(yw.week)}` }

// Eindeutige ISO-Wochen im Bereich [start, end] in Reihenfolge
function weeksInRange(startStr, endStr) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (end < start) return []
  const seen = new Map()
  const cur = new Date(start)
  while (cur <= end) {
    const yw = getISOWeek(toISO(cur))
    const k = weekKey(yw)
    if (!seen.has(k)) seen.set(k, yw)
    cur.setDate(cur.getDate() + 1)
  }
  return Array.from(seen.values())
}

export default function MenteeWeeklyTable({ mentees, tasks }) {
  const { t } = useLanguage()
  const [{ start, end }, setRange] = useState(defaultRange())
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const validRange = start && end && new Date(start) <= new Date(end)

  useEffect(() => {
    if (!validRange) return
    fetchLogs()
  }, [start, end])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('task_logs')
      .select('task_id, mentee_id, date, value, type')
      .gte('date', start)
      .lte('date', end)
    setLogs(data ?? [])
    setLoading(false)
  }

  const weeks = useMemo(() => validRange ? weeksInRange(start, end) : [], [start, end, validRange])

  // Aggregation: menteeId -> taskId -> weekKey -> { pages, minutes, count }
  const totals = useMemo(() => {
    const out = {}
    for (const log of logs) {
      const task = tasks.find(t => t.id === log.task_id)
      const type = resolveLogType(task, log)
      if (!type) continue
      const k = weekKey(getISOWeek(log.date))
      const m = (out[log.mentee_id] ??= {})
      const tk = (m[log.task_id] ??= {})
      const w = (tk[k] ??= { pages: 0, minutes: 0, count: 0 })
      w[type] = (w[type] ?? 0) + Number(log.value)
    }
    return out
  }, [logs, tasks])

  function unitCell(type) {
    if (type === 'minutes') return t('unit_minutes_cell')
    if (type === 'count') return t('unit_count_cell')
    return t('unit_pages_cell')
  }

  function renderCell(menteeId, taskId, k) {
    const w = totals[menteeId]?.[taskId]?.[k]
    if (!w) return <span className="text-slate-300">–</span>
    const parts = []
    if (w.pages) parts.push(`${formatNum(w.pages)} (${unitCell('pages')})`)
    if (w.minutes) parts.push(`${formatNum(w.minutes)} (${unitCell('minutes')})`)
    if (w.count) parts.push(`${formatNum(w.count)} (${unitCell('count')})`)
    if (parts.length === 0) return <span className="text-slate-300">–</span>
    return (
      <div className="flex flex-col leading-tight">
        {parts.map((p, i) => <span key={i} className="text-slate-700">{p}</span>)}
      </div>
    )
  }

  function formatNum(n) {
    return Number.isInteger(n) ? n : Number(n.toFixed(2))
  }

  function getUsername(email) {
    return email?.replace('@mentoren-plattform.intern', '') ?? email
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-[11px] text-slate-500 mb-0.5">{t('period_start')}</label>
          <input
            type="date"
            value={start}
            onChange={e => setRange(r => ({ ...r, start: e.target.value }))}
            className="px-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-0.5">{t('period_end')}</label>
          <input
            type="date"
            value={end}
            onChange={e => setRange(r => ({ ...r, end: e.target.value }))}
            className="px-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500"
          />
        </div>
        {!validRange && (
          <p className="text-xs text-red-500">{t('period_invalid')}</p>
        )}
      </div>

      {validRange && (
        mentees.length === 0 || tasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">{t('table_no_data')}</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-10 bg-white text-left font-semibold text-slate-700 px-2 py-1.5 border-r border-slate-200 align-bottom"
                  >
                    {t('table_mentee_col')}
                  </th>
                  {tasks.map(task => (
                    <th
                      key={task.id}
                      colSpan={weeks.length}
                      className="text-center font-semibold text-slate-700 px-2 py-1.5 border-l border-slate-200"
                    >
                      {task.title}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {tasks.map(task =>
                    weeks.map(yw => (
                      <th
                        key={`${task.id}-${weekKey(yw)}`}
                        className="text-center text-[11px] font-medium text-slate-500 px-1.5 py-1 border-l border-slate-200 whitespace-nowrap"
                      >
                        {t('week_short')}{yw.week}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {mentees.map(mentee => (
                  <tr key={mentee.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-white hover:bg-slate-50/50 px-2 py-1.5 border-r border-slate-200 whitespace-nowrap">
                      <p className="font-medium text-slate-800 leading-tight">{mentee.name}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">@{getUsername(mentee.email)}</p>
                    </td>
                    {tasks.map(task =>
                      weeks.map(yw => (
                        <td
                          key={`${mentee.id}-${task.id}-${weekKey(yw)}`}
                          className="text-center px-1.5 py-1 border-l border-slate-200 whitespace-nowrap"
                        >
                          {renderCell(mentee.id, task.id, weekKey(yw))}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <p className="text-[11px] text-slate-400 text-center py-1.5">{t('loading')}</p>}
          </div>
        )
      )}
    </div>
  )
}
