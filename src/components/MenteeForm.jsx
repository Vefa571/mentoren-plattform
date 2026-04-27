import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

export default function MenteeForm({ onSaved, onCancel }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !username.trim() || password.length < 6) { setError(t('mentee_form_error')); return }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mentee`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password }),
      }
    )
    const result = await res.json()
    setSaving(false)
    if (!res.ok || result.error) { setError(result.error ?? 'Fehler'); return }
    onSaved()
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
      <h3 className="font-semibold text-slate-800 mb-1">{t('new_mentee_title')}</h3>
      <p className="text-xs text-slate-400 mb-4">{t('mentee_hint')}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('name')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('name_placeholder')} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('username_field')}</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('username_placeholder')} className={inputClass} />
          <p className="text-xs text-slate-400 mt-1">{t('username_hint')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('password')}</label>
          <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password_placeholder')} className={inputClass} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-all">
            {saving ? t('creating') : t('create_mentee_btn')}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
