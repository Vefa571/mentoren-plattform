import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { useLanguage } from './contexts/LanguageContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import MenteeDashboard from './pages/MenteeDashboard'

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">{t('loading')}</div>
      </div>
    )
  }

  if (!user) return <Login />

  if (profile?.role === 'admin') return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )

  return (
    <Routes>
      <Route path="/" element={<MenteeDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
