import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { StatusBadge } from '../components/StatusBadge'
import { Timeline, TimelineStep } from '../components/Timeline'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { formatDateTime, formatDurationMinutes } from '../lib/dates'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ShieldAlert,
  XCircle,
  FileText,
  Key,
} from 'lucide-react'

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, profile, isOwner, isManager, isAdmin } = useAuth()

  // Modal states
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Check-In Form
  const [initialNotes, setInitialNotes] = useState('Equipment inspected and ready for operation.')
  const [initialPhotoUrl, setInitialPhotoUrl] = useState('')
  const [cablesPresent, setCablesPresent] = useState(true)
  const [cleanBed, setCleanBed] = useState(true)

  // Return Form
  const [finalNotes, setFinalNotes] = useState('Session concluded. Cleaned bed, stored tool accessories, and powered down.')
  const [finalPhotoUrl, setFinalPhotoUrl] = useState('')
  const [hasDamage, setHasDamage] = useState(false)
  const [hasMissingItems, setHasMissingItems] = useState(false)

  // Incident Form
  const [incCategory, setIncCategory] = useState('DAMAGE')
  const [incSeverity, setIncSeverity] = useState('MEDIUM')
  const [incDescription, setIncDescription] = useState('')

  // Fetch Booking Details with Resource and Reports
  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking_detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          resource:resources(
            id, title, location_name, location_details, buffer_minutes, deposit_amount, rules,
            owner_id, manager_id,
            category:categories(name),
            images:resource_images(url, is_primary),
            owner:profiles!resources_owner_id_fkey(full_name, email)
          ),
          requester:profiles!bookings_requester_id_fkey(full_name, email, department),
          reports:condition_reports(
            *,
            images:condition_report_images(image_url)
          ),
          decisions:booking_decisions(
            *,
            reviewer:profiles(full_name)
          )
        `)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  // Fetch Audit Logs for this Booking
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['booking_audit', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, actor:profiles(full_name)')
        .eq('entity_id', id!)
        .order('created_at', { ascending: true })
      return data || []
    },
    enabled: !!id,
  })

  // Check In Mutation
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !user) return
    setActionLoading(true)

    try {
      // 1. Create Initial Condition Report
      const { data: report, error: repErr } = await supabase
        .from('condition_reports')
        .insert({
          booking_id: booking.id,
          reporter_id: user.id,
          phase: 'INITIAL',
          checklist: { cables_present: cablesPresent, clean_bed: cleanBed },
          notes: initialNotes,
          is_demo: true,
        })
        .select()
        .single()

      if (repErr) throw repErr

      // Add photo if provided
      if (initialPhotoUrl.trim() && report) {
        await supabase.from('condition_report_images').insert({
          report_id: report.id,
          image_url: initialPhotoUrl.trim(),
        })
      }

      // 2. Call transition_booking to CHECKED_IN
      const { error: transErr } = await supabase.rpc('transition_booking', {
        p_booking_id: booking.id,
        p_target_status: 'CHECKED_IN',
        p_notes: 'Requester completed handover check-in.',
      })
      if (transErr) throw transErr

      queryClient.invalidateQueries({ queryKey: ['booking_detail', id] })
      setCheckInDialogOpen(false)
    } catch (err: any) {
      alert('Check-in error: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Return Mutation
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !user) return
    setActionLoading(true)

    try {
      // 1. Create Final Condition Report
      const { data: report, error: repErr } = await supabase
        .from('condition_reports')
        .insert({
          booking_id: booking.id,
          reporter_id: user.id,
          phase: 'FINAL',
          checklist: { return_cleaned: true, parts_checked: true },
          notes: finalNotes,
          has_damage: hasDamage,
          has_missing_items: hasMissingItems,
          is_demo: true,
        })
        .select()
        .single()

      if (repErr) throw repErr

      // Add photo if provided
      if (finalPhotoUrl.trim() && report) {
        await supabase.from('condition_report_images').insert({
          report_id: report.id,
          image_url: finalPhotoUrl.trim(),
        })
      }

      // 2. Transition booking to RETURN_PENDING_INSPECTION
      const { error: transErr } = await supabase.rpc('transition_booking', {
        p_booking_id: booking.id,
        p_target_status: 'RETURN_PENDING_INSPECTION',
        p_notes: hasDamage ? 'Item returned with reported damage notes' : 'Item returned in working order',
      })
      if (transErr) throw transErr

      queryClient.invalidateQueries({ queryKey: ['booking_detail', id] })
      setReturnDialogOpen(false)
    } catch (err: any) {
      alert('Return error: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Owner/Manager Inspect & Complete
  const handleCompleteInspection = async () => {
    if (!booking || !user) return
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('transition_booking', {
        p_booking_id: booking.id,
        p_target_status: 'COMPLETED',
        p_notes: 'Owner/Manager inspected return condition and closed booking.',
      })
      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['booking_detail', id] })
    } catch (err: any) {
      alert('Error completing booking: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Incident Mutation
  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !user) return
    setActionLoading(true)

    try {
      const { data: newInc, error: incErr } = await supabase
        .from('incidents')
        .insert({
          booking_id: booking.id,
          resource_id: booking.resource_id,
          reporter_id: user.id,
          category: incCategory,
          severity: incSeverity,
          description: incDescription,
          status: 'OPEN',
          is_demo: true,
        })
        .select()
        .single()

      if (incErr) throw incErr

      // Transition booking to INCIDENT_REPORTED if not completed
      await supabase.rpc('transition_booking', {
        p_booking_id: booking.id,
        p_target_status: 'INCIDENT_REPORTED',
        p_notes: `Incident escalated: ${incCategory} (${incSeverity})`,
      })

      queryClient.invalidateQueries({ queryKey: ['booking_detail', id] })
      setIncidentDialogOpen(false)
      navigate(`/incidents/${newInc.id}`)
    } catch (err: any) {
      alert('Error creating incident: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Cancellation
  const handleCancelBooking = async () => {
    if (!booking) return
    if (!confirm('Are you sure you want to cancel this reservation?')) return
    try {
      const { error } = await supabase.rpc('transition_booking', {
        p_booking_id: booking.id,
        p_target_status: 'CANCELLED',
        p_notes: 'Cancelled by user request.',
      })
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['booking_detail', id] })
    } catch (err: any) {
      alert('Cancellation error: ' + err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="h-96 rounded-xl border skeleton" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container max-w-5xl mx-auto px-4 sm:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-navy">Booking not found</h2>
        <Link to="/bookings">
          <Button variant="outline" className="mt-4">
            Back to Bookings
          </Button>
        </Link>
      </div>
    )
  }

  const isUserRequester = user?.id === booking.requester_id
  const isUserOwnerOrManager =
    user?.id === booking.resource?.owner_id ||
    user?.id === booking.resource?.manager_id ||
    isManager ||
    isAdmin

  // Timeline Steps Construction
  const timelineSteps: TimelineStep[] = [
    {
      title: 'Reservation Requested',
      timestamp: booking.created_at,
      description: `Requested by ${booking.requester?.full_name || 'Requester'}`,
      status: 'completed',
    },
    {
      title: 'Owner / Manager Approval',
      timestamp: booking.status === 'PENDING_APPROVAL' ? null : booking.updated_at,
      description:
        booking.status === 'PENDING_APPROVAL'
          ? 'Awaiting facility owner verification and approval'
          : booking.status === 'REJECTED'
          ? 'Reservation was rejected'
          : 'Approved by resource manager with exclusion constraint lock',
      status:
        booking.status === 'REJECTED'
          ? 'failed'
          : ['APPROVED', 'CHECKED_IN', 'RETURN_PENDING_INSPECTION', 'COMPLETED'].includes(booking.status)
          ? 'completed'
          : 'current',
    },
    {
      title: 'Equipment Check-In & Initial Report',
      timestamp: booking.reports?.find((r: any) => r.phase === 'INITIAL')?.created_at || null,
      description:
        booking.status === 'APPROVED'
          ? 'Ready for check-in! Inspect equipment condition upon arrival.'
          : ['CHECKED_IN', 'RETURN_PENDING_INSPECTION', 'COMPLETED'].includes(booking.status)
          ? 'Check-in completed. Handover condition recorded.'
          : 'Pending approval',
      status:
        ['CHECKED_IN', 'RETURN_PENDING_INSPECTION', 'COMPLETED'].includes(booking.status)
          ? 'completed'
          : booking.status === 'APPROVED'
          ? 'current'
          : 'upcoming',
    },
    {
      title: 'Return & Condition Checklist',
      timestamp: booking.reports?.find((r: any) => r.phase === 'FINAL')?.created_at || null,
      description:
        booking.status === 'CHECKED_IN'
          ? 'Active usage session. Complete return checklist and take final photos when finished.'
          : ['RETURN_PENDING_INSPECTION', 'COMPLETED'].includes(booking.status)
          ? 'Equipment returned. Condition report logged.'
          : 'Pending check-in',
      status:
        ['RETURN_PENDING_INSPECTION', 'COMPLETED'].includes(booking.status)
          ? 'completed'
          : booking.status === 'CHECKED_IN'
          ? 'current'
          : 'upcoming',
    },
    {
      title: 'Inspection & Completed',
      timestamp: booking.status === 'COMPLETED' ? booking.updated_at : null,
      description:
        booking.status === 'COMPLETED'
          ? 'Return inspected and confirmed by lab staff. Booking closed.'
          : booking.status === 'RETURN_PENDING_INSPECTION'
          ? 'Awaiting lab owner/manager final inspection confirmation.'
          : 'Pending return submission',
      status:
        booking.status === 'COMPLETED'
          ? 'completed'
          : booking.status === 'RETURN_PENDING_INSPECTION'
          ? 'current'
          : 'upcoming',
    },
  ]

  const showAccessInstructions = ['APPROVED', 'CHECKED_IN', 'RETURN_PENDING_INSPECTION'].includes(booking.status)

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-xs text-muted-foreground hover:text-navy gap-1 -ml-2 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy">{booking.resource?.title}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Reservation ID: <span className="font-mono">{booking.id}</span>
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Check-In Button */}
          {isUserRequester && booking.status === 'APPROVED' && (
            <Button
              onClick={() => setCheckInDialogOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" /> Check In & Inspect
            </Button>
          )}

          {/* Return Button */}
          {isUserRequester && booking.status === 'CHECKED_IN' && (
            <Button
              onClick={() => setReturnDialogOpen(true)}
              className="bg-navy hover:bg-navy-800 text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
            >
              <Clock className="h-4 w-4" /> Return Equipment
            </Button>
          )}

          {/* Owner Inspect & Confirm Return */}
          {isUserOwnerOrManager && booking.status === 'RETURN_PENDING_INSPECTION' && (
            <Button
              onClick={handleCompleteInspection}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Inspection & Complete
            </Button>
          )}

          {/* Report Incident */}
          <Button
            onClick={() => setIncidentDialogOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 h-9 gap-1"
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Report Issue
          </Button>

          {/* Cancel */}
          {['PENDING_APPROVAL', 'APPROVED', 'WAITLISTED'].includes(booking.status) && (
            <Button
              onClick={handleCancelBooking}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-rose-600 h-9"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Booking Details & Conditions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reservation Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-navy">Reservation Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-navy-50/50 border border-navy-100">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-navy-400" /> Start Time:
                  </span>
                  <p className="font-semibold text-navy text-sm">
                    {formatDateTime(booking.start_time, 'EEE, MMM dd, yyyy - hh:mm a')}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-navy-400" /> End Time:
                  </span>
                  <p className="font-semibold text-navy text-sm">
                    {formatDateTime(booking.end_time, 'EEE, MMM dd, yyyy - hh:mm a')}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-navy">Project & Research Purpose:</span>
                <p className="p-3 rounded-lg bg-muted/40 border border-border text-foreground/90 leading-relaxed">
                  {booking.purpose}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <span className="text-muted-foreground">Requester:</span>
                  <p className="font-semibold text-navy">{booking.requester?.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">{booking.requester?.department}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Facility Location:</span>
                  <p className="font-semibold text-navy">{booking.resource?.location_name}</p>
                  <p className="text-[11px] text-muted-foreground">Buffer: {booking.buffer_minutes} mins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Instructions (Unlocked) */}
          {showAccessInstructions && (
            <Card className="border-teal-200 bg-teal-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-teal-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-teal-700" /> Access & Security Details (Unlocked)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-teal-950 space-y-2">
                <p className="leading-relaxed">
                  {booking.resource?.location_details || 'Please present your student ID card at the lab check-in counter.'}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-teal-800 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Authorized for current booking session. Do not share entry keys with non-registered users.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Condition Reports History */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-navy flex items-center gap-2">
                <FileText className="h-4 w-4 text-navy-400" /> Handover Condition Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4">
              {booking.reports?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No condition reports filed yet.</p>
              ) : (
                booking.reports?.map((rep: any) => (
                  <div key={rep.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={rep.phase === 'INITIAL' ? 'teal' : 'info'} className="text-[10px] uppercase font-bold">
                        {rep.phase} CONDITION REPORT
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{formatDateTime(rep.created_at)}</span>
                    </div>

                    <p className="text-foreground leading-relaxed pt-1">{rep.notes}</p>

                    {/* Photos */}
                    {rep.images?.length > 0 && (
                      <div className="pt-2 flex gap-2">
                        {rep.images.map((img: any, idx: number) => (
                          <a key={idx} href={img.image_url} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={img.image_url}
                              alt="Condition proof"
                              className="h-16 w-24 rounded-lg object-cover border border-border hover:opacity-90"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Status Timeline & Audit Viewer */}
        <div className="space-y-6">
          <Card className="border-navy-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-navy">Workflow Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline steps={timelineSteps} />
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-navy">Audit Trail (Immutable)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-[11px]">
              {auditLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">No audit records yet.</p>
              ) : (
                auditLogs.map((log: any) => (
                  <div key={log.id} className="border-b border-border/50 pb-2 space-y-0.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-navy-800">{log.action}</span>
                      <span>{formatDateTime(log.created_at, 'MMM dd, HH:mm')}</span>
                    </div>
                    <p className="text-foreground/80">{log.explanation}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Check In Modal */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Equipment Handover & Check-In</DialogTitle>
            <DialogDescription className="text-xs">
              Verify equipment status upon starting your session.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckInSubmit} className="space-y-3 pt-2 text-xs">
            <div className="space-y-2 p-3 rounded-lg bg-navy-50/60 border border-navy-100">
              <p className="font-semibold text-navy">Condition Checklist:</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cablesPresent}
                  onChange={(e) => setCablesPresent(e.target.checked)}
                  className="rounded border-border text-navy h-4 w-4"
                />
                Power supply, cables, and optical accessories verified present
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanBed}
                  onChange={(e) => setCleanBed(e.target.checked)}
                  className="rounded border-border text-navy h-4 w-4"
                />
                Build platform / stage is clean and free of residue
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Initial Condition Notes</label>
              <Textarea
                required
                rows={2}
                value={initialNotes}
                onChange={(e) => setInitialNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Condition Photo URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://images.unsplash.com/... or uploaded photo link"
                value={initialPhotoUrl}
                onChange={(e) => setInitialPhotoUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCheckInDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                {actionLoading ? 'Saving...' : 'Confirm Check-In'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Modal */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Equipment & Conclude Session</DialogTitle>
            <DialogDescription className="text-xs">
              File final condition notes and photos for owner/manager inspection.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReturnSubmit} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-navy">Final Return Notes</label>
              <Textarea
                required
                rows={3}
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200">
              <p className="font-semibold text-amber-900">Condition Flags:</p>
              <label className="flex items-center gap-2 cursor-pointer text-amber-950">
                <input
                  type="checkbox"
                  checked={hasDamage}
                  onChange={(e) => setHasDamage(e.target.checked)}
                  className="rounded border-border text-rose-600 h-4 w-4"
                />
                Noticeable wear, cosmetic damage, or mechanical issue occurred
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-amber-950">
                <input
                  type="checkbox"
                  checked={hasMissingItems}
                  onChange={(e) => setHasMissingItems(e.target.checked)}
                  className="rounded border-border text-rose-600 h-4 w-4"
                />
                Accessories or tooling missing from container
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Return Photo URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://images.unsplash.com/... or uploaded photo link"
                value={finalPhotoUrl}
                onChange={(e) => setFinalPhotoUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReturnDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} size="sm" className="bg-navy hover:bg-navy-800 text-white">
                {actionLoading ? 'Submitting...' : 'Submit Return'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Incident Modal */}
      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Equipment Incident</DialogTitle>
            <DialogDescription className="text-xs">
              File a formal report for damage, late returns, or safety concerns.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIncidentSubmit} className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-navy">Incident Category</label>
                <select
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="DAMAGE">Damage</option>
                  <option value="MISSING_EQUIPMENT">Missing Equipment</option>
                  <option value="LATE_RETURN">Late Return</option>
                  <option value="SAFETY_CONCERN">Safety Concern</option>
                  <option value="UNAUTHORIZED_USE">Unauthorized Use</option>
                  <option value="SCHEDULING_CONFLICT">Scheduling Conflict</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy">Severity</label>
                <select
                  value={incSeverity}
                  onChange={(e) => setIncSeverity(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Detailed Description</label>
              <Textarea
                required
                rows={4}
                placeholder="Explain what happened, any visible marks, parts involved, or immediate actions taken..."
                value={incDescription}
                onChange={(e) => setIncDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIncidentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                {actionLoading ? 'Filing...' : 'Submit Incident Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
