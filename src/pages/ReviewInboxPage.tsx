import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { formatDateTime } from '../lib/dates'
import {
  Inbox,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Building,
} from 'lucide-react'

export function ReviewInboxPage() {
  const queryClient = useQueryClient()
  const { user, isOwner, isManager, isAdmin } = useAuth()

  // Selected Booking for Reject / Waitlist Action
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [actionType, setActionType] = useState<'REJECT' | 'WAITLIST' | null>(null)
  const [reasonNotes, setReasonNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Fetch Pending Bookings for Resources Owned or Managed by current user
  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['review_inbox', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Query bookings
      let query = supabase
        .from('bookings')
        .select(`
          *,
          resource:resources(
            id, title, location_name, buffer_minutes, owner_id, manager_id,
            category:categories(name)
          ),
          requester:profiles!bookings_requester_id_fkey(
            id, full_name, email, department, student_staff_id
          )
        `)
        .in('status', ['PENDING_APPROVAL', 'WAITLISTED'])
        .order('created_at', { ascending: true })

      // Filter by ownership if not full admin
      if (!isAdmin) {
        // RLS ensures only records for owned/managed resources are returned
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  // Approve Booking
  const handleApprove = async (bookingId: string) => {
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      const { data, error } = await supabase.rpc('approve_booking', {
        p_booking_id: bookingId,
        p_note: 'Approved by lab reviewer.',
      })

      if (error) {
        throw error
      }

      setActionSuccess('Booking approved successfully!')
      queryClient.invalidateQueries({ queryKey: ['review_inbox'] })
    } catch (err: any) {
      setActionError(err.message || 'Approval failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Reject or Waitlist Booking
  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking || !actionType) return
    setActionLoading(true)
    setActionError(null)

    try {
      const targetStatus = actionType === 'REJECT' ? 'REJECTED' : 'WAITLISTED'
      const { error } = await supabase.rpc('transition_booking', {
        p_booking_id: selectedBooking.id,
        p_target_status: targetStatus,
        p_notes: reasonNotes.trim() || undefined,
      })

      if (error) throw error

      if (actionType === 'WAITLIST') {
        // Add waitlist entry
        await supabase.from('waitlist_entries').insert({
          resource_id: selectedBooking.resource_id,
          requester_id: selectedBooking.requester_id,
          booking_id: selectedBooking.id,
          position: 1,
          status: 'WAITING',
        })
      }

      queryClient.invalidateQueries({ queryKey: ['review_inbox'] })
      setSelectedBooking(null)
      setActionType(null)
      setReasonNotes('')
    } catch (err: any) {
      setActionError(err.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Review & Approval Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review incoming reservation requests, check safety qualifications, and resolve scheduling queues.
          </p>
        </div>
        <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 self-start sm:self-auto">
          {pendingRequests.length} Pending Review
        </span>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold">Action Blocked</p>
            <p className="mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl border skeleton" />
          ))}
        </div>
      ) : pendingRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Review inbox is clear"
          description="All incoming equipment requests have been processed. Great job keeping the lab queue moving!"
        />
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((req: any) => (
            <Card key={req.id} className="border-border hover:border-navy-200 transition-all p-5 shadow-2xs">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Request Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {req.resource?.category?.name || 'Equipment'}
                    </Badge>
                    <span className="text-border">•</span>
                    <StatusBadge status={req.status} />
                    <span className="text-border">•</span>
                    <span className="text-xs text-muted-foreground">
                      Requested {formatDateTime(req.created_at)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-navy">
                    <Link to={`/resources/${req.resource_id}`} className="hover:text-teal-700">
                      {req.resource?.title}
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-medium text-navy flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-navy-400" />
                      {req.requester?.full_name} ({req.requester?.department || 'Student/Researcher'})
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-navy-600">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      {formatDateTime(req.start_time, 'MMM dd, hh:mm a')} &rarr; {formatDateTime(req.end_time, 'hh:mm a')}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground/90 leading-relaxed">
                    <strong className="text-navy">Research Purpose:</strong> {req.purpose}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full lg:w-auto">
                  <Button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading}
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve Slot
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedBooking(req)
                      setActionType('WAITLIST')
                    }}
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 text-navy"
                  >
                    Waitlist
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedBooking(req)
                      setActionType('REJECT')
                    }}
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 h-9 gap-1"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject or Waitlist Explanation Dialog */}
      <Dialog
        open={Boolean(selectedBooking && actionType)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null)
            setActionType(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'REJECT' ? 'Reject Reservation Request' : 'Move Request to Waitlist'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {actionType === 'REJECT'
                ? 'Please specify a constructive reason for rejection (e.g. conflicting maintenance or missing course module).'
                : 'Explain queue placement to the requester.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDialogSubmit} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-navy">
                {actionType === 'REJECT' ? 'Rejection Reason (Required)' : 'Waitlist Explanation'}
              </label>
              <Textarea
                required
                rows={3}
                placeholder="State reason clearly..."
                value={reasonNotes}
                onChange={(e) => setReasonNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBooking(null)
                  setActionType(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading || !reasonNotes.trim()}
                size="sm"
                className={
                  actionType === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-navy hover:bg-navy-800 text-white'
                }
              >
                {actionLoading ? 'Processing...' : actionType === 'REJECT' ? 'Confirm Rejection' : 'Place on Waitlist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
