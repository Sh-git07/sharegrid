import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

interface RoleRouteProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user, roles, loading } = useAuth()

  if (loading && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    )
  }

  if (!user && !loading) {
    return <Navigate to="/login" replace />
  }

  const hasPermission = allowedRoles.some((role) => roles.includes(role))

  if (!hasPermission && !loading) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
