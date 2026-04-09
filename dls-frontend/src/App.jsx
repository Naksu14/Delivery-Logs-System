import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminRoutes from './apps/admin/admin-routes'
import KioskRoutes from './apps/kiosk/kiosk-routes'
import RequireAuth from './apps/auth/components/RequireAuth'
import LoginPage from './apps/auth/pages/LoginPage'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/admin" replace />
  return children
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  return isAuthenticated
    ? <Navigate to="/admin" replace />
    : <Navigate to="/kiosk" replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route
              path="/admin/*"
              element={(
                <RequireAuth>
                  <AdminRoutes />
                </RequireAuth>
              )}
            />
            <Route path="/kiosk/*" element={<KioskRoutes />} />
            <Route
              path="/login"
              element={(
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              )}
            />
            <Route
              path="/"
              element={<RootRedirect />}
            />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
