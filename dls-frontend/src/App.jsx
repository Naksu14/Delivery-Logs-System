import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AdminRoutes from './apps/admin/admin-routes'
import KioskRoutes from './apps/kiosk/kiosk-routes'
import RequireAuth from './apps/auth/components/RequireAuth'
import LoginPage from './apps/auth/pages/LoginPage'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

function getTabTitle(pathname) {
  if (pathname === '/login') return 'Admin Login | Delivery Logs System'
  if (pathname === '/kiosk' || pathname === '/kiosk/') return 'Kiosk Home | Delivery Logs System'
  if (pathname === '/kiosk/new') return 'New log | Delivery Logs System'
  if (pathname === '/kiosk/success') return 'Submission Success | Delivery Logs System'
  if (pathname === '/kiosk/history') return 'Kiosk History | Delivery Logs System'

  if (pathname === '/admin' || pathname === '/admin/') return 'Dashboard | Delivery Logs System'
  if (pathname === '/admin/delivery-logs') return 'Logs | Delivery Logs System'
  if (pathname === '/admin/new-delivery') return 'Delivery Workspace | Delivery Logs System'
  if (pathname === '/admin/companies') return 'Companies | Delivery Logs System'
  if (/^\/admin\/companies\/[^/]+$/.test(pathname)) {
    return 'Company Details | Delivery Logs System'
  }
  if (pathname === '/admin/account') return 'My Account | Delivery Logs System'

  return 'Delivery Logs System'
}

function RouteTitleManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = getTabTitle(pathname)
  }, [pathname])

  return null
}

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
          <RouteTitleManager />
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
