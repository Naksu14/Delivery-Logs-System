import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginAuth } from '../services/authServices'

const STORAGE_KEY = 'dls_auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    accessToken: null,
    isLoading: true
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      const parsed = JSON.parse(raw)
      if (parsed?.accessToken && parsed?.user) {
        setAuthState({
          user: parsed.user,
          accessToken: parsed.accessToken,
          isLoading: false
        })
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    } catch {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (email, password) => {
    const payload = await loginAuth({ email, password })
    const nextState = {
      user: payload.user,
      accessToken: payload.access_token,
      isLoading: false
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: nextState.user,
        accessToken: nextState.accessToken
      })
    )

    setAuthState(nextState)
    return payload
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthState({
      user: null,
      accessToken: null,
      isLoading: false
    })
  }

  const value = useMemo(
    () => ({
      user: authState.user,
      accessToken: authState.accessToken,
      isAuthenticated: Boolean(authState.accessToken),
      isLoading: authState.isLoading,
      login,
      logout
    }),
    [authState]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
