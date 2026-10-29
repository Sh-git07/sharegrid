import React, { useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DemoLoginPanelProps {
  onSuccess?: (targetPath: string) => void
  compact?: boolean
}

export function DemoLoginPanel({ onSuccess, compact = false }: DemoLoginPanelProps) {
  const { switchDemoUser, user } = useAuth()
  const [switching, setSwitching] = useState<string | null>(null)
  const navigate = useNavigate()

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  if (!isDemoMode) return null

  const handleSelectRole = async (role: 'requester' | 'owner' | 'manager' | 'admin') => {
    try {
      setSwitching(role)
      await switchDemoUser(role)
      if (onSuccess) {
        onSuccess('/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Demo login failed', err)
    } finally {
      setSwitching(null)
    }
  }

  const roleConfigs = [
    {
      role: 'requester' as const,
      title: 'Requester',
      name: 'Aarav Sharma',
      desc: 'Student researcher booking lab slots',
      color: 'border-blue-200 hover:border-blue-400 bg-blue-50/40',
      path: '/dashboard',
    },
    {
      role: 'owner' as const,
      title: 'Resource Owner',
      name: 'Dr. Neha Patel',
      desc: 'FabLab owner approving printer slots',
      color: 'border-teal-200 hover:border-teal-400 bg-teal-50/40',
      path: '/dashboard',
    },
    {
      role: 'manager' as const,
      title: 'Manager',
      name: 'Prof. Rajesh Verma',
      desc: 'Facility manager verifying safety records',
      color: 'border-amber-200 hover:border-amber-400 bg-amber-50/40',
      path: '/dashboard',
    },
    {
      role: 'admin' as const,
      title: 'Admin',
      name: 'Campus Admin',
      desc: 'Institution policies & audit log viewer',
      color: 'border-purple-200 hover:border-purple-400 bg-purple-50/40',
      path: '/dashboard',
    },
  ]

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-navy-50/80 rounded-lg border border-navy-100 text-xs shrink-0">
        <span className="text-[11px] font-semibold text-navy-700 px-2 flex items-center gap-1 shrink-0">
          <Sparkles className="h-3 w-3 text-teal-600 shrink-0" /> Demo Switch:
        </span>
        {roleConfigs.map((cfg) => {
          const isActive = user?.email?.startsWith(cfg.role)
          return (
            <button
              key={cfg.role}
              data-testid={`quick-switch-${cfg.role}`}
              onClick={() => handleSelectRole(cfg.role)}
              disabled={switching !== null}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-navy-700 text-white shadow-xs'
                  : 'bg-white hover:bg-navy-100 text-navy-800 border border-navy-200'
              } ${switching === cfg.role ? 'opacity-70 animate-pulse' : ''}`}
            >
              {cfg.title}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/60 to-navy-50/40 p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-teal-600" />
        <h3 className="text-base font-semibold text-navy">Quick Demo Sign-In</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Sign in instantly using real Supabase credentials. Full Row-Level Security applies.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roleConfigs.map((cfg) => (
          <button
            key={cfg.role}
            data-testid={`demo-login-${cfg.role}`}
            onClick={() => handleSelectRole(cfg.role)}
            disabled={switching !== null}
            className={`p-3 rounded-lg border text-left transition-all ${cfg.color} hover:shadow-xs group`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">{cfg.title}</span>
              <span className="text-[11px] text-teal-700 font-medium group-hover:underline">Sign in &rarr;</span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-0.5">{cfg.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cfg.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
