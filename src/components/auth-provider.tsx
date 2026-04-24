'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'investigator' | 'analyst' | 'viewer'
  permissions: string[]
  organization?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Validate session via cookie-based endpoint
      const response = await fetch('/api/auth/validate', { credentials: 'include' })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()
      setUser(data.user)
      toast.success('Login successful')
      router.push('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setLoading(true)

      if (!googleClientId) {
        throw new Error('Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.')
      }
      
      // Initialize Google OAuth
      if (typeof window !== 'undefined' && window.google) {
        window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile',
          prompt: 'select_account',
          callback: async (response: any) => {
            try {
              // Send the Google token to our backend
              const authResponse = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ token: response.access_token }),
              })

              if (!authResponse.ok) {
                const error = await authResponse.json()
                throw new Error(error.message || 'Google login failed')
              }

              const data = await authResponse.json()
              // Cookie-based session is managed by server; no local storage
              setUser(data.user)
              toast.success('Google login successful')
              router.push('/')
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Google login failed')
            } finally {
              setLoading(false)
            }
          },
        }).requestAccessToken()
      } else {
        // Fallback: use Google Identity Services popup via dynamic script load
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () => {
          if (window.google) {
            window.google.accounts.oauth2.initTokenClient({
              client_id: googleClientId!,
              scope: 'email profile',
              prompt: 'select_account',
              callback: async (response: any) => {
                try {
                  const authResponse = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ token: response.access_token }),
                  })
                  if (!authResponse.ok) throw new Error('Google login failed')
                  const data = await authResponse.json()
                  setUser(data.user)
                  toast.success('Google login successful')
                  router.push('/')
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Google login failed')
                } finally {
                  setLoading(false)
                }
              },
            }).requestAccessToken()
          } else {
            toast.error('Google sign-in failed to load. Please try again.')
            setLoading(false)
          }
        }
        script.onerror = () => {
          toast.error('Could not load Google sign-in. Check your internet connection.')
          setLoading(false)
        }
        document.head.appendChild(script)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google login failed')
      setLoading(false)
    }
  }

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .finally(() => {
        setUser(null)
        toast.success('Logged out successfully')
        router.push('/login')
      })
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return user.permissions.includes(permission) || user.role === 'admin'
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}