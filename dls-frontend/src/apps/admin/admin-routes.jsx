import { Routes, Route } from 'react-router-dom'
import AdminTopNav from './components/AdminTopNav'
import AdminHome from './pages/AdminHome'
import AdminDeliveryLogs from './pages/AdminDeliveryLogs'
import AdminNewDelivery from './pages/AdminNewDelivery'
import AdminCompanies from './pages/AdminCompanies'
import AdminAccount from './pages/AdminAccount'

export default function AdminRoutes() {
	return (
		<Routes>
			<Route element={<AdminTopNav />}>
				<Route index element={<AdminHome />} />
				<Route path="delivery-logs" element={<AdminDeliveryLogs />} />
				<Route path="new-delivery" element={<AdminNewDelivery />} />
				<Route path="companies" element={<AdminCompanies />} />
				<Route path="account" element={<AdminAccount />} />
			</Route>
		</Routes>
	)
}
