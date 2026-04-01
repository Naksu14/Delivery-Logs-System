import { Routes, Route } from 'react-router-dom'
import AdminHome from './pages/AdminHome'

export default function AdminRoutes() {
	return (
		<Routes>
			<Route index element={<AdminHome/>} />
			<Route path="settings" element={<div>Admin Settings (placeholder)</div>} />
			<Route path="users" element={<div>Admin Users (placeholder)</div>} />
		</Routes>
	)
}
