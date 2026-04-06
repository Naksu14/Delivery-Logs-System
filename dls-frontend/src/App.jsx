import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminRoutes from './apps/admin/admin-routes'
import KioskRoutes from './apps/kiosk/kiosk-routes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import './App.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes/>} />
          <Route path="/kiosk/*" element={<KioskRoutes/>} />
          <Route path="/" element={<div>Welcome — select a route above.</div>} />
        </Routes>
    </Router>
    </QueryClientProvider>
  )
}

export default App
