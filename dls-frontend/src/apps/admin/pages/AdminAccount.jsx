import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineCheckCircle, HiOutlinePencilSquare, HiOutlineXCircle } from 'react-icons/hi2'
import { useAuth } from '../../../context/AuthContext'
import AdminPageHeader from '../components/AdminPageHeader'
import { getCurrentUser, updateCurrentUser } from '../../../services/usersServices'
import './admin-account.css'

function normalizeError(error, fallback) {
  const message = error?.response?.data?.message
  if (Array.isArray(message) && message.length > 0) return String(message[0])
  if (typeof message === 'string' && message.trim()) return message
  return fallback
}

export default function AdminAccount() {
  const queryClient = useQueryClient()
  const { user, accessToken, updateUser } = useAuth()
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [isPasswordEditing, setIsPasswordEditing] = useState(false)
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('')
  const [profileErrorMessage, setProfileErrorMessage] = useState('')
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('')
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('')
  const [profileForm, setProfileForm] = useState({
    fullname: user?.fullname || '',
    email: user?.email || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getCurrentUser(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30000,
  })

  useEffect(() => {
    if (!profile) return
    setProfileForm({
      fullname: profile.fullname || '',
      email: profile.email || ''
    })
  }, [profile])

  const profileValidations = useMemo(() => {
    const issues = []
    if (!profileForm.fullname.trim()) issues.push('Name is required.')
    if (!profileForm.email.trim()) {
      issues.push('Email is required.')
    } else if (!/^\S+@\S+\.\S+$/.test(profileForm.email.trim())) {
      issues.push('Please enter a valid email address.')
    }
    return issues
  }, [profileForm])

  const passwordValidations = useMemo(() => {
    const issues = []
    if (!passwordForm.password) {
      issues.push('Please enter a new password.')
      return issues
    }

    if (passwordForm.password.length < 6) issues.push('Password must be at least 6 characters.')
    if (passwordForm.password !== passwordForm.confirmPassword) issues.push('Password and confirm password do not match.')

    return issues
  }, [passwordForm])

  const hasProfileChanges = useMemo(() => {
    const baseName = (profile?.fullname || '').trim()
    const baseEmail = (profile?.email || '').trim()
    return (
      profileForm.fullname.trim() !== baseName ||
      profileForm.email.trim() !== baseEmail
    )
  }, [profileForm, profile])

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => updateCurrentUser(payload, accessToken),
    onSuccess: (updated) => {
      setProfileSuccessMessage('Profile details updated successfully.')
      setProfileErrorMessage('')
      setIsProfileEditing(false)
      updateUser(updated)
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
    onError: (error) => {
      setProfileErrorMessage(normalizeError(error, 'Unable to update profile right now.'))
      setProfileSuccessMessage('')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: (payload) => updateCurrentUser(payload, accessToken),
    onSuccess: () => {
      setPasswordSuccessMessage('Password updated successfully.')
      setPasswordErrorMessage('')
      setIsPasswordEditing(false)
      setPasswordForm({ password: '', confirmPassword: '' })
    },
    onError: (error) => {
      setPasswordErrorMessage(normalizeError(error, 'Unable to update password right now.'))
      setPasswordSuccessMessage('')
    },
  })

  const onProfileFieldChange = (event) => {
    const { name, value } = event.target
    setProfileErrorMessage('')
    setProfileSuccessMessage('')
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const onPasswordFieldChange = (event) => {
    const { name, value } = event.target
    setPasswordErrorMessage('')
    setPasswordSuccessMessage('')
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const onCancelProfile = () => {
    setIsProfileEditing(false)
    setProfileErrorMessage('')
    setProfileSuccessMessage('')
    setProfileForm({
      fullname: profile?.fullname || user?.fullname || '',
      email: profile?.email || user?.email || ''
    })
  }

  const onCancelPassword = () => {
    setIsPasswordEditing(false)
    setPasswordErrorMessage('')
    setPasswordSuccessMessage('')
    setPasswordForm({
      password: '',
      confirmPassword: ''
    })
  }

  const onSubmitProfile = (event) => {
    event.preventDefault()
    setProfileErrorMessage('')
    setProfileSuccessMessage('')

    if (profileValidations.length > 0) {
      setProfileErrorMessage(profileValidations[0])
      return
    }

    if (!hasProfileChanges) {
      setProfileErrorMessage('No changes to save.')
      return
    }

    const payload = {
      fullname: profileForm.fullname.trim(),
      email: profileForm.email.trim().toLowerCase(),
    }

    updateProfileMutation.mutate(payload)
  }

  const onSubmitPassword = (event) => {
    event.preventDefault()
    setPasswordErrorMessage('')
    setPasswordSuccessMessage('')

    if (passwordValidations.length > 0) {
      setPasswordErrorMessage(passwordValidations[0])
      return
    }

    updatePasswordMutation.mutate({ password: passwordForm.password })
  }

  return (
    <section className="space-y-4">
      <AdminPageHeader title="My Account" subtitle="Manage your profile details and password securely." />

      <div className="admin-account-layout">
        <article className="admin-card admin-account-card">
          <div className="admin-account-head">
            <div>
              <h3>Profile Details</h3>
              <p>Update your name and email address.</p>
            </div>
            <div className="admin-account-head-right">
              <span className={`admin-account-mode ${isProfileEditing ? 'is-editing' : 'is-readonly'}`}>
                {isProfileEditing ? 'Editing' : 'Read Only'}
              </span>
              <span className="admin-account-role">{(profile?.role || user?.role || 'user').toUpperCase()}</span>
            </div>
          </div>

          {profileSuccessMessage ? (
            <div className="admin-account-alert is-success">
              <HiOutlineCheckCircle />
              <span>{profileSuccessMessage}</span>
            </div>
          ) : null}

          {profileErrorMessage ? (
            <div className="admin-account-alert is-error">
              <HiOutlineXCircle />
              <span>{profileErrorMessage}</span>
            </div>
          ) : null}

          <form className="admin-account-form" onSubmit={onSubmitProfile}>
            <div className="admin-account-grid">
              <div className="admin-account-field">
                <label htmlFor="fullname">Full Name</label>
                <input
                  id="fullname"
                  name="fullname"
                  className="admin-input-control"
                  value={profileForm.fullname}
                  onChange={onProfileFieldChange}
                  disabled={!isProfileEditing || isLoading || updateProfileMutation.isPending || updatePasswordMutation.isPending}
                />
              </div>

              <div className="admin-account-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="admin-input-control"
                  value={profileForm.email}
                  onChange={onProfileFieldChange}
                  disabled={!isProfileEditing || isLoading || updateProfileMutation.isPending || updatePasswordMutation.isPending}
                />
              </div>
            </div>

            <div className="admin-account-actions">
              {!isProfileEditing ? (
                <button type="button" className="admin-btn-primary" onClick={() => setIsProfileEditing(true)} disabled={isLoading || updatePasswordMutation.isPending}>
                  <HiOutlinePencilSquare />
                  Edit Details
                </button>
              ) : (
                <>
                  <button type="button" className="admin-btn-secondary" onClick={onCancelProfile} disabled={updateProfileMutation.isPending}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={updateProfileMutation.isPending || profileValidations.length > 0}
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Details'}
                  </button>
                </>
              )}
            </div>
          </form>
        </article>

        <article className="admin-card admin-account-card">
          <div className="admin-account-head">
            <div>
              <h3>Password & Security</h3>
              <p>Use a strong password with at least 6 characters.</p>
            </div>
            <div className="admin-account-head-right">
              <span className={`admin-account-mode ${isPasswordEditing ? 'is-editing' : 'is-readonly'}`}>
                {isPasswordEditing ? 'Editing' : 'Read Only'}
              </span>
            </div>
          </div>

          {passwordSuccessMessage ? (
            <div className="admin-account-alert is-success">
              <HiOutlineCheckCircle />
              <span>{passwordSuccessMessage}</span>
            </div>
          ) : null}

          {passwordErrorMessage ? (
            <div className="admin-account-alert is-error">
              <HiOutlineXCircle />
              <span>{passwordErrorMessage}</span>
            </div>
          ) : null}

          <form className="admin-account-form" onSubmit={onSubmitPassword}>
            <div className="admin-account-grid">
              <div className="admin-account-field">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="admin-input-control"
                  value={passwordForm.password}
                  onChange={onPasswordFieldChange}
                  placeholder="Enter new password"
                  disabled={!isPasswordEditing || isLoading || updatePasswordMutation.isPending || updateProfileMutation.isPending}
                />
              </div>

              <div className="admin-account-field">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="admin-input-control"
                  value={passwordForm.confirmPassword}
                  onChange={onPasswordFieldChange}
                  placeholder="Re-enter new password"
                  disabled={!isPasswordEditing || isLoading || updatePasswordMutation.isPending || updateProfileMutation.isPending}
                />
              </div>
            </div>

            <div className="admin-account-actions">
              {!isPasswordEditing ? (
                <button type="button" className="admin-btn-primary" onClick={() => setIsPasswordEditing(true)} disabled={isLoading || updateProfileMutation.isPending}>
                  <HiOutlinePencilSquare />
                  Change Password
                </button>
              ) : (
                <>
                  <button type="button" className="admin-btn-secondary" onClick={onCancelPassword} disabled={updatePasswordMutation.isPending}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={updatePasswordMutation.isPending || passwordValidations.length > 0}
                  >
                    {updatePasswordMutation.isPending ? 'Saving...' : 'Save Password'}
                  </button>
                </>
              )}
            </div>
          </form>
        </article>
      </div>
    </section>
  )
}
