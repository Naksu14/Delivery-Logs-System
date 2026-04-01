import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import AdminRoutes from './apps/admin/admin-routes'
import KioskRoutes from './apps/kiosk/kiosk-routes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import './App.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <header style={{padding:8}}>
        <nav>
          <Link to="/admin" style={{marginRight:12}}>Admin</Link>
          <Link to="/kiosk">Kiosk</Link>
        </nav>
      </header>

      <main style={{padding:12}}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes/>} />
          <Route path="/kiosk/*" element={<KioskRoutes/>} />
          <Route path="/" element={<div>Welcome — select a route above.</div>} />
        </Routes>
      </main>
    </Router>
    </QueryClientProvider>
  )
}

export default App
