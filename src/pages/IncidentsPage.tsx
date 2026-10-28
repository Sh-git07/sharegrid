import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/EmptyState'
import { formatDateTime } from '../lib/dates'
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, ArrowRight, User } from 'lucide-react'

export function IncidentsPage() {
  const { user } = useAuth()
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents_list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          resource:resources(id, title, location_name),
          reporter:profiles!incidents_reporter_id_fkey(full_name),
          assignee:profiles!incidents_assignee_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const filtered = incidents.filter((inc: any) => {
    if (filterStatus === 'ALL') return true
    return inc.status === filterStatus
  })

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <Badge variant="destructive">CRITICAL</Badge>
      case 'HIGH':
        return <Badge variant="destructive" className="bg-rose-500">HIGH</Badge>
      case 'MEDIUM':
        return <Badge variant="warning">MEDIUM</Badge>
      default:
        return <Badge variant="secondary">LOW</Badge>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'RESOLVED':
        return (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3 mr-1" /> RESOLVED
          </Badge>
        )
      case 'UNDER_REVIEW':
        return (
          <Badge variant="info">
            <Clock className="h-3 w-3 mr-1" /> UNDER REVIEW
          </Badge>
        )
      case 'OPEN':
        return (
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3 mr-1" /> OPEN
          </Badge>
        )
      default:
        return <Badge variant="outline">{st}</Badge>
    }
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Incident & Safety Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track equipment damage reports, safety infractions, late returns, and resolution notes.
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 border-b border-border pb-2 text-xs">
        {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === st
                ? 'bg-navy text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-navy'
            }`}
          >
            {st === 'ALL' ? 'All Incidents' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No incidents logged"
          description="There are currently no open equipment disputes or safety incidents."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inc: any) => (
            <Link
              key={inc.id}
              to={`/incidents/${inc.id}`}
              className="block group rounded-xl border bg-card hover:border-navy-300 p-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(inc.status)}
                    {getSeverityBadge(inc.severity)}
                    <span className="text-border">•</span>
                    <span className="text-xs font-semibold text-navy uppercase tracking-wider">
                      {inc.category.replace('_', ' ')}
                    </span>
                    <span className="text-border">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(inc.created_at)}
                    </span>
                  </div>

                  <h3 className="font-semibold text-navy text-base group-hover:text-teal-700 transition-colors">
                    {inc.resource?.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto text-xs text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-muted-foreground">
                    Reported by: <strong className="text-navy">{inc.reporter?.full_name}</strong>
                  </span>
                  {inc.assignee && (
                    <span className="text-[11px] text-teal-700">
                      Assigned: {inc.assignee.full_name}
                    </span>
                  )}
                  <span className="text-xs font-medium text-teal-700 group-hover:underline flex items-center gap-1 mt-1">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
