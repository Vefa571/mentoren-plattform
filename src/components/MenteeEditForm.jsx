import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

const DOMAIN = '@mentoren-plattform.intern'

export default function MenteeEditForm({ mentee, onSaved, onCancel }) {
  const { t } = useLanguage()
  const [name, setName] = useState(mentee.name)
  const [username, setUsername] = useState(mentee.email?.replace(DOMAIN, '') ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !username.trim()) { setError(t('mentee_edit_error')); return }
    if (password && password.length < 6) { setError(t('mentee_edit_pw_error')); return }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-mentee`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'update', menteeId: mentee.id, name: name.trim(), username: username.trim(), password: password || undefined }),
      }
    )
    const result = await res.json()
    setSaving(false)
    if (!res.ok || result.error) { setError(result.error ?? 'Fehler'); return }
    onSaved()
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white'

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <h3 className="font-semibold text-slate-800 mb-4">{t('edit_mentee_title')}</h3>
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('name')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('username_field')}</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('new_password')}</label>
          <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password_keep')} className={inputClass} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 shadow-sm disabled:opacity-50 transition-all">
            {saving ? t('saving') : t('save')}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
