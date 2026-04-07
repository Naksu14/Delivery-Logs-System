import { useAuth } from '../../../context/AuthContext'

export default function AdminAccount() {
  const { user } = useAuth()

  return (
    <section>
      <h1 className="admin-page__title">My Account</h1>
      <div className="admin-card">
        <p>Name: {user?.fullname || 'N/A'}</p>
        <p>Email: {user?.email || 'N/A'}</p>
        <p>Role: {user?.role || 'N/A'}</p>
      </div>
    </section>
  )
}
