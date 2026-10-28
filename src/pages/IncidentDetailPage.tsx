import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { formatDateTime } from '../lib/dates'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  User,
  MessageSquare,
  Building,
} from 'lucide-react'

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isManager, isAdmin } = useAuth()

  const [newNote, setNewNote] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [targetStatus, setTargetStatus] = useState<string>('RESOLVED')
  const [actionLoading, setActionLoading] = useState(false)

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident_detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          resource:resources(id, title, location_name),
          reporter:profiles!incidents_reporter_id_fkey(full_name, email, department),
          assignee:profiles!incidents_assignee_id_fkey(full_name, email),
          updates:incident_updates(
            *,
            author:profiles(full_name)
          )
        `)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  // Add Note / Update
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incident || !user || !newNote.trim()) return
    setActionLoading(true)

    try {
      await supabase.from('incident_updates').insert({
        incident_id: incident.id,
        author_id: user.id,
        note: newNote.trim(),
        status_from: incident.status,
        status_to: incident.status,
      })

      setNewNote('')
      queryClient.invalidateQueries({ queryKey: ['incident_detail', id] })
    } catch (err: any) {
      alert('Error adding update: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Manager Resolve / Update Status
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incident || !user) return
    setActionLoading(true)

    try {
      // 1. Update incident
      const { error: incErr } = await supabase
        .from('incidents')
        .update({
          status: targetStatus,
          resolution_notes: resolutionNotes.trim() || incident.resolution_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incident.id)

      if (incErr) throw incErr

      // 2. Add audit update entry
      await supabase.from('incident_updates').insert({
        incident_id: incident.id,
        author_id: user.id,
        status_from: incident.status,
        status_to: targetStatus,
        note: resolutionNotes.trim() || `Status updated to ${targetStatus}`,
      })

      // 3. Notify reporter
      await supabase.from('notifications').insert({
        recipient_id: incident.reporter_id,
        title: `Incident ${targetStatus}`,
        message: `Your incident for ${incident.resource?.title} has been updated to ${targetStatus}.`,
        type: 'INCIDENT_UPDATED',
        entity_type: 'incident',
        entity_id: incident.id,
      })

      queryClient.invalidateQueries({ queryKey: ['incident_detail', id] })
      setResolutionNotes('')
    } catch (err: any) {
      alert('Error updating status: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div className="h-96 rounded-xl border skeleton" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-navy">Incident not found</h2>
        <Link to="/incidents">
          <Button variant="outline" className="mt-4">
            Back to Incidents
          </Button>
        </Link>
      </div>
    )
  }

  const canManageIncident = isManager || isAdmin || user?.id === incident.assignee_id

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-xs text-muted-foreground hover:text-navy gap-1 -ml-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Button>

      {/* Incident Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="destructive">{incident.severity}</Badge>
            <Badge variant={incident.status === 'RESOLVED' ? 'success' : 'warning'}>
              {incident.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Reported {formatDateTime(incident.created_at || new Date().toISOString())}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy">
            {incident.category.replace('_', ' ')}: {incident.resource?.title}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Facility: {incident.resource?.location_name} • Reported by: {incident.reporter?.full_name}
          </p>
        </div>
      </div>

      {/* Incident Description */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-navy">Incident Narrative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="p-4 rounded-xl bg-muted/40 border border-border leading-relaxed whitespace-pre-line text-foreground/90">
            {incident.description}
          </p>

          {incident.resolution_notes && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resolution Determination
              </span>
              <p className="leading-relaxed">{incident.resolution_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manager Resolution Action Box */}
      {canManageIncident && incident.status !== 'RESOLVED' && (
        <Card className="border-teal-300 bg-teal-50/20 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-teal-900">
              Lab Management Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-navy">Update Status To</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="AWAITING_INFORMATION">AWAITING INFORMATION</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="DISMISSED">DISMISSED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy">
                  Resolution Explanation / Corrective Actions
                </label>
                <Textarea
                  rows={2}
                  required
                  placeholder="e.g. Inspected tool, replaced minor filament guide, no damage to extruder. Equipment cleared for operation."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <Button
                type="submit"
                disabled={actionLoading}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
              >
                {actionLoading ? 'Updating...' : 'Save Resolution Decision'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Updates History */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-navy flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-navy-400" /> Incident Activity & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {incident.updates?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No activity updates yet.</p>
          ) : (
            <div className="space-y-3">
              {incident.updates?.map((up: any) => (
                <div key={up.id} className="p-3.5 rounded-lg border border-border/80 bg-card space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span className="font-semibold text-navy">{up.author?.full_name}</span>
                    <span>{formatDateTime(up.created_at)}</span>
                  </div>
                  {up.status_to && up.status_from !== up.status_to && (
                    <div className="flex items-center gap-1.5 text-[10px] text-teal-800 font-semibold py-0.5">
                      Status changed: {up.status_from} &rarr; {up.status_to}
                    </div>
                  )}
                  <p className="text-foreground leading-relaxed">{up.note}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="pt-3 border-t border-border space-y-2">
            <Textarea
              rows={2}
              placeholder="Add an update note or comment..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="text-xs"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={actionLoading || !newNote.trim()}
                size="sm"
                className="bg-navy hover:bg-navy-800 text-white text-xs"
              >
                Post Update
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
