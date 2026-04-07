import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
  if (isAuthenticated) return <AdminRoutes />
  return children
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
              element={(
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              )}
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
