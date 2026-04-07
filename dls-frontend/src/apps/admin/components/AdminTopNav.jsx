import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBuildingOffice2,
  HiOutlineClipboardDocumentList,
  HiOutlinePlusCircle,
  HiOutlineUserCircle,
  HiOutlineUser,
  HiOutlineViewColumns
} from 'react-icons/hi2'
import { useAuth } from '../../../context/AuthContext'
import './admin-top-nav.css'

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard', icon: HiOutlineViewColumns },
  { to: '/admin/delivery-logs', label: 'Delivery Logs', icon: HiOutlineClipboardDocumentList },
  { to: '/admin/new-delivery', label: 'New Delivery', icon: HiOutlinePlusCircle },
  { to: '/admin/companies', label: 'Companies', icon: HiOutlineBuildingOffice2 }
]

function ProfileMenu({ onNavigateAccount, onLogout }) {
  return (
    <div className="admin-profile-menu" role="menu" aria-label="User account menu">
      <button className="admin-profile-menu__item" type="button" onClick={onNavigateAccount} role="menuitem">
        <HiOutlineUser />
        My Account
      </button>
      <button className="admin-profile-menu__item" type="button" onClick={onLogout} role="menuitem">
        <HiOutlineArrowRightOnRectangle />
        Sign Out
      </button>
    </div>
  )
}

export default function AdminTopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const pageSubtitle = useMemo(() => {
    if (location.pathname.startsWith('/admin/delivery-logs')) return 'Track and manage all delivery records in one place.'
    if (location.pathname.startsWith('/admin/new-delivery')) return 'Create a new delivery log with complete details.'
    if (location.pathname.startsWith('/admin/companies')) return 'Manage connected companies and branch details.'
    if (location.pathname.startsWith('/admin/account')) return 'View your profile details and account preferences.'
    return 'Monitor and manage all delivery records in one place.'
  }, [location.pathname])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const openAccount = () => {
    setIsProfileOpen(false)
    navigate('/admin/account')
  }

  const signOut = () => {
    setIsProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <header className="admin-top-nav">
        <div className="admin-brand">
          <span className="admin-brand__badge">△</span>
          <div>
            <div className="admin-brand__title">Launchpad Coworking</div>
            <div className="admin-brand__subtitle">Delivery Logs Management System</div>
          </div>
        </div>

        <nav className="admin-nav-links" aria-label="Primary">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-profile" ref={profileRef}>
          <button
            className="admin-profile__trigger"
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
          >
            <div className="admin-profile__info">
              <span className="admin-profile__name">{user?.fullname || 'Admin'}</span>
              <span className="admin-profile__id">{user?.email || 'admin@local'}</span>
            </div>
            <span className="admin-profile__avatar">
              <HiOutlineUserCircle />
            </span>
          </button>
          {isProfileOpen ? <ProfileMenu onNavigateAccount={openAccount} onLogout={signOut} /> : null}
        </div>
      </header>

      <main className="admin-page">
        <p className="admin-page__subtitle">{pageSubtitle}</p>
        <Outlet />
      </main>
    </div>
  )
}
