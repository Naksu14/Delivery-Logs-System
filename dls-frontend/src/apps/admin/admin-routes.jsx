import { Routes, Route } from 'react-router-dom'
import AdminTopNav from './components/AdminTopNav'
import AdminHome from './pages/AdminHome'
import AdminDeliveryLogs from './pages/AdminDeliveryLogs'
import AdminNewDelivery from './pages/AdminNewDelivery'
import AdminCompanies from './pages/AdminCompanies'
import AdminAccount from './pages/AdminAccount'
import AdminCompanyDetails from './pages/AdminCompanyDetails'
import AdminSpreadsheetSettings from './pages/AdminSpreadsheetSettings'
import { AdminRealtimeProvider } from './context/AdminRealtimeContext'

export default function AdminRoutes() {
	return (
		<Routes>
			<Route element={<AdminRealtimeProvider><AdminTopNav /></AdminRealtimeProvider>}>
				<Route index element={<AdminHome />} />
				<Route path="delivery-logs" element={<AdminDeliveryLogs />} />
				<Route path="new-delivery" element={<AdminNewDelivery />} />
				<Route path="companies" element={<AdminCompanies />} />
				<Route path="companies/:companyId" element={<AdminCompanyDetails />} />
				<Route path="spreadsheet-settings" element={<AdminSpreadsheetSettings />} />
				<Route path="account" element={<AdminAccount />} />
			</Route>
		</Routes>
	)
}
