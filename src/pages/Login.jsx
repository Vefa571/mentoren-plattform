import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, LangToggle } from '../contexts/LanguageContext'

const DOMAIN = '@mentoren-plattform.intern'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const email = identifier.includes('@') ? identifier : identifier.trim().toLowerCase() + DOMAIN
    const { error } = await signIn(email, password)
    if (error) setError(t('login_error'))
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{t('platform')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('username')}</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              placeholder={t('username')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm mt-2"
          >
            {loading ? t('login_loading') : t('login_btn')}
          </button>
        </form>
      </div>
    </div>
  )
}
