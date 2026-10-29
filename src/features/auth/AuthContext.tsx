import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: string[]
  loading: boolean
  isRequester: boolean
  isOwner: boolean
  isManager: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  switchDemoUser: (role: 'requester' | 'owner' | 'manager' | 'admin') => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_CREDENTIALS: Record<string, { email: string; password: string }> = {
  requester: { email: 'requester@sharegrid.demo', password: 'RequesterPass123!' },
  owner: { email: 'owner@sharegrid.demo', password: 'OwnerPass123!' },
  manager: { email: 'manager@sharegrid.demo', password: 'ManagerPass123!' },
  admin: { email: 'admin@sharegrid.demo', password: 'AdminPass123!' },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const switchingRef = useRef(false)

  const fetchUserData = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      setRoles([])
      setLoading(false)
      return
    }

    try {
      // 1. Fetch Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      // 2. Fetch Roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)

      setProfile(prof || null)
      setRoles(userRoles ? userRoles.map((r) => r.role) : ['REQUESTER'])
    } catch (err) {
      console.error('Error fetching user data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      fetchUserData(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && switchingRef.current) {
        return // Ignore intermediate signed out during demo switch
      }
      setSession(session)
      setUser(session?.user ?? null)
      await fetchUserData(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      return { error }
    }
    if (data.session?.user) {
      setUser(data.session.user)
      setSession(data.session)
      await fetchUserData(data.session.user)
    }
    return { error: null }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
      setRoles([])
      setLoading(false)
    }
  }

  const switchDemoUser = async (role: 'requester' | 'owner' | 'manager' | 'admin') => {
    switchingRef.current = true
    setLoading(true)
    const creds = DEMO_CREDENTIALS[role]
    if (!creds) {
      setLoading(false)
      switchingRef.current = false
      return
    }
    try {
      await supabase.auth.signOut()
      const { data, error } = await supabase.auth.signInWithPassword(creds)
      if (error) {
        console.error('Demo switch error:', error)
        throw error
      }
      if (data.session?.user) {
        setUser(data.session.user)
        setSession(data.session)
        await fetchUserData(data.session.user)
      }
    } finally {
      switchingRef.current = false
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user)
    }
  }

  const isRequester = roles.includes('REQUESTER')
  const isOwner = roles.includes('RESOURCE_OWNER')
  const isManager = roles.includes('MANAGER')
  const isAdmin = roles.includes('ADMIN')

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      roles,
      loading,
      isRequester,
      isOwner,
      isManager,
      isAdmin,
      signIn,
      signOut,
      switchDemoUser,
      refreshProfile,
    }),
    [user, session, profile, roles, loading, isRequester, isOwner, isManager, isAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
