import { createContext, useContext, useState } from 'react'
import { translations } from '../lib/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'de')

  function t(key) {
    return translations[lang]?.[key] ?? translations['de'][key] ?? key
  }

  function setLanguage(l) {
    setLang(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LangToggle() {
  const { lang, setLanguage } = useLanguage()
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
      {['de', 'tr'].map(l => (
        <button
          key={l}
          onClick={() => setLanguage(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            lang === l
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
