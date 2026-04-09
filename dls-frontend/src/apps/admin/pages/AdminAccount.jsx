import { useAuth } from '../../../context/AuthContext'
import AdminPageHeader from '../components/AdminPageHeader'

export default function AdminAccount() {
  const { user } = useAuth()

  return (
    <section className="space-y-4">
      <AdminPageHeader title="My Account" subtitle="View your profile and login details." />
      <div className="admin-card">
        <p>Name: {user?.fullname || 'N/A'}</p>
        <p>Email: {user?.email || 'N/A'}</p>
        <p>Role: {user?.role || 'N/A'}</p>
      </div>
    </section>
  )
}
