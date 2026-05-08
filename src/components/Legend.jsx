import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

const UNITS = ['pages', 'minutes', 'count']

function unitLabel(t, unit) {
  if (unit === 'minutes') return t('type_minutes')
  if (unit === 'count') return t('type_count')
  return t('type_pages')
}

function unitCell(t, unit) {
  if (unit === 'minutes') return t('unit_minutes_cell')
  if (unit === 'count') return t('unit_count_cell')
  return t('unit_pages_cell')
}

export default function Legend({ editable = false, currentUserId = null }) {
  const { t } = useLanguage()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ label: '', min_value: '', unit: 'pages' })
  const [error, setError] = useState('')

  useEffect(() => { fetchEntries() }, [])

  async function fetchEntries() {
    const { data } = await supabase
      .from('legend_entries')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setEntries(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setError('')
    setEditingId(null)
    setDraft({ label: '', min_value: '', unit: 'pages' })
    setAdding(true)
  }

  function openEdit(entry) {
    setError('')
    setAdding(false)
    setEditingId(entry.id)
    setDraft({
      label: entry.label,
      min_value: entry.min_value != null ? String(entry.min_value) : '',
      unit: entry.unit ?? 'pages',
    })
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
    setError('')
  }

  async function save() {
    if (!draft.label.trim() || !draft.unit) {
      setError(t('legend_save_error'))
      return
    }
    const minVal = draft.min_value === '' ? null : Number(draft.min_value)
    const payload = {
      label: draft.label.trim(),
      min_value: Number.isFinite(minVal) ? minVal : null,
      unit: draft.unit,
    }
    if (editingId) {
      await supabase.from('legend_entries').update(payload).eq('id', editingId)
    } else {
      const nextOrder = entries.length === 0 ? 0 : Math.max(...entries.map(e => e.sort_order ?? 0)) + 1
      await supabase.from('legend_entries').insert({
        ...payload,
        sort_order: nextOrder,
        created_by: currentUserId,
      })
    }
    cancel()
    fetchEntries()
  }

  async function remove(id) {
    if (!confirm(t('delete') + '?')) return
    await supabase.from('legend_entries').delete().eq('id', id)
    fetchEntries()
  }

  if (loading) return null
  if (!editable && entries.length === 0) return null

  const showForm = adding || editingId !== null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">{t('legend_title')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{t('legend_subtitle')}</p>
        </div>
        {editable && !showForm && (
          <button
            onClick={openAdd}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-blue-700 shadow-sm transition-colors"
          >
            {t('legend_add')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder={t('legend_label_placeholder')}
              value={draft.label}
              onChange={e => setDraft({ ...draft, label: e.target.value })}
              className="sm:col-span-5 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder={t('legend_min')}
              value={draft.min_value}
              onChange={e => setDraft({ ...draft, min_value: e.target.value })}
              className="sm:col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
            />
            <select
              value={draft.unit}
              onChange={e => setDraft({ ...draft, unit: e.target.value })}
              className="sm:col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            >
              {UNITS.map(u => (
                <option key={u} value={u}>{unitLabel(t, u)}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={cancel}
              className="text-sm px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={save}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition-colors"
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">{t('legend_empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="text-left font-medium py-2 pr-3">{t('legend_label')}</th>
                <th className="text-left font-medium py-2 pr-3">{t('legend_min')}</th>
                <th className="text-left font-medium py-2 pr-3">{t('legend_unit')}</th>
                {editable && <th className="py-2 w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-3 text-slate-800">{entry.label}</td>
                  <td className="py-2.5 pr-3 text-slate-700 font-medium">
                    {entry.min_value != null ? entry.min_value : '–'}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    {unitLabel(t, entry.unit)} <span className="text-slate-400 text-xs">({unitCell(t, entry.unit)})</span>
                  </td>
                  {editable && (
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(entry)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => remove(entry.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
