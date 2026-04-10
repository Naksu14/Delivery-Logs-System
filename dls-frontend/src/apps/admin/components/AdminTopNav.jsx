import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
} from 'react-icons/hi2'
import { IoIosPerson } from "react-icons/io";
import { MdOutlineBarChart } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa";
import { AiFillPlusCircle } from "react-icons/ai";
import { HiBuildingOffice2 } from "react-icons/hi2";
import { HiOutlineTableCells } from 'react-icons/hi2'

import { useAuth } from '../../../context/AuthContext'
import { useAdminRealtime } from '../context/AdminRealtimeContext'
import launchpadImg from '../../../assets/images/launchpad 2.png'
import './admin-top-nav.css'

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard', icon: MdOutlineBarChart },
  { to: '/admin/delivery-logs', label: 'Delivery Logs', icon: FaBoxOpen },
  { to: '/admin/new-delivery', label: 'New Delivery', icon: AiFillPlusCircle },
  { to: '/admin/companies', label: 'Companies', icon: HiBuildingOffice2 },
  { to: '/admin/spreadsheet-settings', label: 'Sheets', icon: HiOutlineTableCells }
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
  const { isConnected, unreadCount, clearUnread, toasts, removeToast } = useAdminRealtime()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    if (location.pathname.startsWith('/admin/delivery-logs')) {
      clearUnread()
    }
  }, [location.pathname, clearUnread])
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
          <img src={launchpadImg} alt="Launchpad logo" className="admin-brand__badge" />
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
              <Icon className='text-xl'/>
              {label}
              {to === '/admin/delivery-logs' && unreadCount > 0 ? (
                <span className="admin-nav-link__badge" aria-label={`${unreadCount} new realtime updates`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className={`admin-realtime-pill${isConnected ? ' is-connected' : ''}`}>
              <span className="admin-realtime-pill__dot" />
              {isConnected ? 'Live Updates' : 'Reconnecting...'}
            </div>

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
              <IoIosPerson />
            </span>
          </button>
          {isProfileOpen ? <ProfileMenu onNavigateAccount={openAccount} onLogout={signOut} /> : null}
        </div>
      </header>

      <main className="admin-page">
        <Outlet />
      </main>

      <div className="admin-realtime-toasts" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`admin-realtime-toast is-${toast.type}`}>
            <p>{toast.message}</p>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
