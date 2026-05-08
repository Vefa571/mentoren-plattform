import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

const EMPTY_DRAFT = { label: '', min_pages: '', min_minutes: '', min_count: '' }

function parseNum(s) {
  if (s === '' || s === null || s === undefined) return null
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// Legacy-Eintrag (nur min_value + unit) → in min_pages/_minutes/_count auflösen
function effectiveMins(entry) {
  let pages = entry.min_pages
  let minutes = entry.min_minutes
  let count = entry.min_count
  if (pages == null && minutes == null && count == null && entry.min_value != null) {
    if (entry.unit === 'pages') pages = entry.min_value
    else if (entry.unit === 'minutes') minutes = entry.min_value
    else if (entry.unit === 'count') count = entry.min_value
  }
  return { pages, minutes, count }
}

export default function Legend({ editable = false, currentUserId = null }) {
  const { t } = useLanguage()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
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
    setDraft(EMPTY_DRAFT)
    setAdding(true)
  }

  function openEdit(entry) {
    setError('')
    setAdding(false)
    setEditingId(entry.id)
    const eff = effectiveMins(entry)
    setDraft({
      label: entry.label,
      min_pages: eff.pages != null ? String(eff.pages) : '',
      min_minutes: eff.minutes != null ? String(eff.minutes) : '',
      min_count: eff.count != null ? String(eff.count) : '',
    })
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
    setError('')
  }

  async function save() {
    const pages = parseNum(draft.min_pages)
    const minutes = parseNum(draft.min_minutes)
    const count = parseNum(draft.min_count)
    if (!draft.label.trim() || (pages == null && minutes == null && count == null)) {
      setError(t('legend_save_error'))
      return
    }
    const payload = {
      label: draft.label.trim(),
      min_pages: pages,
      min_minutes: minutes,
      min_count: count,
      // Legacy-Felder leeren, damit Anzeige eindeutig ist
      min_value: null,
      unit: null,
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
          <input
            type="text"
            placeholder={t('legend_label_placeholder')}
            value={draft.label}
            onChange={e => setDraft({ ...draft, label: e.target.value })}
            className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <NumField
              label={t('type_pages')}
              value={draft.min_pages}
              onChange={v => setDraft({ ...draft, min_pages: v })}
            />
            <NumField
              label={t('type_minutes')}
              value={draft.min_minutes}
              onChange={v => setDraft({ ...draft, min_minutes: v })}
            />
            <NumField
              label={t('type_count')}
              value={draft.min_count}
              onChange={v => setDraft({ ...draft, min_count: v })}
            />
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
                <th className="text-center font-medium py-2 px-2">{t('type_pages')}</th>
                <th className="text-center font-medium py-2 px-2">{t('type_minutes')}</th>
                <th className="text-center font-medium py-2 px-2">{t('type_count')}</th>
                {editable && <th className="py-2 w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const eff = effectiveMins(entry)
                return (
                  <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3 text-slate-800">{entry.label}</td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium">
                      {eff.pages != null ? eff.pages : <span className="text-slate-300">–</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium">
                      {eff.minutes != null ? eff.minutes : <span className="text-slate-300">–</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium">
                      {eff.count != null ? eff.count : <span className="text-slate-300">–</span>}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NumField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-0.5">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
      />
    </label>
  )
}
