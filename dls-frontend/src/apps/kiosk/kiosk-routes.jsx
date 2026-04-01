import { Routes, Route } from 'react-router-dom'
import KioskHome from './pages/KioskHome'

export default function KioskRoutes() {
	return (
		<Routes>
			<Route index element={<KioskHome/>} />
			<Route path="new" element={<div>New Kiosk Entry (placeholder)</div>} />
		</Routes>
	)
}
