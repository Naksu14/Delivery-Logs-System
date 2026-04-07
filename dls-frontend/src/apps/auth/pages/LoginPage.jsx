import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi2'
import { useAuth } from '../../../context/AuthContext'
import KioskBlobsBackground, {
  DEFAULT_BACKGROUND_GRADIENT,
  DEFAULT_BLOB_GRADIENT
} from '../../kiosk/components/KioskBlobsBackground'
import '../styles/auth-login.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    try {
      setIsSubmitting(true)
      await login(email.trim(), password)
      const redirectPath = location.state?.from?.pathname || '/admin'
      navigate(redirectPath, { replace: true })
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      const fallback = 'Invalid credentials. Please check your email and password.'
      setErrorMessage(Array.isArray(apiMessage) ? apiMessage[0] : apiMessage || fallback)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <KioskBlobsBackground
        backgroundGradient={DEFAULT_BACKGROUND_GRADIENT}
        blobGradient={DEFAULT_BLOB_GRADIENT}
        opacity={0.9}
      />

      <div className="login-shell">
        <div className="login-brand">
          <div className="login-brand__badge">△</div>
          <div>
            <h1 className="login-brand__title">Launchpad Coworking</h1>
            <p className="login-brand__subtitle">Delivery Logs Management System</p>
          </div>
        </div>

        <form className="login-card" onSubmit={onSubmit}>
          <h2 className="login-card__heading">Admin Login</h2>
          <p className="login-card__copy">Sign in to manage deliveries and company records.</p>

          <label className="login-field">
            <span>Email</span>
            <div className="login-field__input-wrap">
              <HiOutlineUser />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@email.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-field__input-wrap">
              <HiOutlineLockClosed />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
