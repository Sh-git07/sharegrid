import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { evaluateEligibility } from '../lib/eligibility'
import { validateBookingTimes } from '../lib/booking-rules'
import { formatDurationMinutes, formatDateTime } from '../lib/dates'
import {
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  User,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Calendar,
  FileCheck,
  ArrowRight,
  Info,
  Building,
  Upload,
} from 'lucide-react'

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, profile, isManager, isAdmin, isOwner } = useAuth()

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false)
  const [selectedReqForUpload, setSelectedReqForUpload] = useState<any | null>(null)

  // Booking Form State
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)

  // Training Submission State
  const [certificateUrl, setCertificateUrl] = useState('')
  const [trainingNotes, setTrainingNotes] = useState('')
  const [trainingSubmitting, setTrainingSubmitting] = useState(false)

  // 1. Fetch Resource
  const { data: resource, isLoading: resourceLoading } = useQuery({
    queryKey: ['resource', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          category:categories(id, name, slug),
          images:resource_images(url, is_primary, caption),
          owner:profiles!resources_owner_id_fkey(full_name, email, department),
          manager:profiles!resources_manager_id_fkey(full_name, email),
          requirements:resource_requirements(*)
        `)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  // 2. Fetch User's Training Records
  const { data: userTrainingRecords = [] } = useQuery({
    queryKey: ['my_training_records', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('training_records')
        .select('*')
        .eq('user_id', user.id)
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  // 3. Fetch User's 30-Day Usage Hours
  const { data: usageHours = 0 } = useQuery({
    queryKey: ['my_usage_hours', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      const { data, error } = await supabase
        .from('usage_records')
        .select('duration_hours')
        .eq('user_id', user.id)
        .gte('recorded_at', thirtyDaysAgo)
        .eq('is_cancelled', false)

      if (error) return 0
      return data ? data.reduce((acc, curr) => acc + Number(curr.duration_hours || 0), 0) : 0
    },
    enabled: !!user,
  })

  // 4. Check if user currently has an active/checked-in booking for this resource (to reveal location details)
  const { data: hasActiveBooking = false } = useQuery({
    queryKey: ['has_active_booking', id, user?.id],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('bookings')
        .select('id')
        .eq('resource_id', id!)
        .eq('requester_id', user.id)
        .in('status', ['APPROVED', 'CHECKED_IN', 'RETURN_PENDING_INSPECTION'])
        .limit(1)

      return (data && data.length > 0) || false
    },
    enabled: !!id && !!user,
  })

  // Evaluate Eligibility
  const eligibility = resource
    ? evaluateEligibility(profile, resource, resource.requirements || [], userTrainingRecords, usageHours)
    : null

  // Handle Training Submission
  const handleTrainingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedReqForUpload || !resource) return
    setTrainingSubmitting(true)

    try {
      const { error } = await supabase.from('training_records').insert({
        user_id: user.id,
        course_name: selectedReqForUpload.title,
        course_code: selectedReqForUpload.training_course_code || 'SAFE-CERT',
        certificate_url: certificateUrl.trim() || 'https://sharegrid.demo/certs/submitted-evidence.pdf',
        verification_status: 'PENDING',
        reviewer_notes: trainingNotes,
        is_demo: true,
      })

      if (error) throw error

      // Notify managers
      await supabase.from('notifications').insert({
        recipient_id: resource.owner_id,
        title: 'New Training Verification Request',
        message: `${profile?.full_name || 'Requester'} submitted training evidence for ${selectedReqForUpload.title}`,
        type: 'VERIFICATION_REQUESTED',
        entity_type: 'verification',
      })

      queryClient.invalidateQueries({ queryKey: ['my_training_records'] })
      setTrainingDialogOpen(false)
      setCertificateUrl('')
      setTrainingNotes('')
    } catch (err: any) {
      alert('Error submitting training: ' + err.message)
    } finally {
      setTrainingSubmitting(false)
    }
  }

  // Handle Booking Creation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError(null)
    setBookingSuccess(null)

    if (!user || !resource) {
      navigate('/login')
      return
    }

    // Client Validation
    const validation = validateBookingTimes(resource, startTime, endTime)
    if (!validation.valid) {
      setBookingError(validation.error || 'Invalid booking times')
      return
    }

    try {
      const { data: newBooking, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          resource_id: resource.id,
          requester_id: user.id,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          buffer_minutes: resource.buffer_minutes || 15,
          purpose,
          status: 'PENDING_APPROVAL',
          is_demo: true,
        })
        .select()
        .single()

      if (bookingErr) throw bookingErr

      // Notify Owner
      await supabase.from('notifications').insert({
        recipient_id: resource.owner_id,
        title: 'New Booking Request',
        message: `${profile?.full_name || 'A user'} requested to book ${resource.title}.`,
        type: 'BOOKING_REQUESTED',
        entity_type: 'booking',
        entity_id: newBooking.id,
      })

      queryClient.invalidateQueries({ queryKey: ['my_bookings'] })
      setBookingSuccess('Booking request submitted successfully! Awaiting owner review.')
      setTimeout(() => {
        setBookingDialogOpen(false)
        navigate(`/bookings/${newBooking.id}`)
      }, 1500)
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit booking')
    }
  }

  if (resourceLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="h-96 rounded-xl border skeleton" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-navy">Resource not found</h2>
        <Link to="/resources">
          <Button variant="outline" className="mt-4">
            Back to Marketplace
          </Button>
        </Link>
      </div>
    )
  }

  const primaryImage =
    resource.images?.find((img: any) => img.is_primary)?.url ||
    resource.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'

  const canViewLocationDetails =
    hasActiveBooking ||
    isManager ||
    isAdmin ||
    (user && (user.id === resource.owner_id || user.id === resource.manager_id))

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/resources" className="hover:text-navy">
          Marketplace
        </Link>
        <span>/</span>
        <span>{resource.category?.name || 'Equipment'}</span>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[200px]">{resource.title}</span>
      </div>

      {/* Main Grid: Left Details & Right Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Hero Image */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted border border-border shadow-xs">
            <img src={primaryImage} alt={resource.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4">
              <StatusBadge status={resource.status} className="shadow-md text-xs px-3 py-1" />
            </div>
            {resource.category && (
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-white/95 text-navy font-semibold backdrop-blur-sm shadow-md">
                  {resource.category.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Title & Core Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">{resource.title}</h1>
              {user && (user.id === resource.owner_id || isAdmin) && (
                <Link to={`/owner/resources/${resource.id}/edit`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Edit Resource
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5 font-medium text-navy">
                <MapPin className="h-4 w-4 text-navy-500" />
                {resource.location_name}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-teal-600" />
                Managed by {resource.owner?.full_name || 'Lab Staff'}
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="h-4 w-4 text-navy-400" />
                Shikha's Organisation
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border bg-card p-6 space-y-3">
            <h2 className="text-base font-semibold text-navy">Description & Specs</h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {resource.description}
            </p>
          </div>

          {/* Operating Rules & Policies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="text-xs font-semibold text-navy uppercase tracking-wider">Usage Rules</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {resource.rules || 'Standard campus lab safety protocol applies. Return clean and powered down.'}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="text-xs font-semibold text-navy uppercase tracking-wider">Cancellation Policy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {resource.cancellation_policy || `Free cancellation up to ${resource.min_notice_hours}h before start.`}
              </p>
            </div>
          </div>

          {/* Location Details (Privacy Protected) */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
                <MapPin className="h-4 w-4 text-navy" /> Access & Location Instructions
              </h3>
              {!canViewLocationDetails && (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                  <Lock className="h-2.5 w-2.5 mr-1" /> Protected
                </Badge>
              )}
            </div>

            {canViewLocationDetails ? (
              <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-teal-800">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" /> Precise Access Details
                </p>
                <p className="leading-relaxed">
                  {resource.location_details || 'Please report to the laboratory reception desk.'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Precise locker access codes, room entry pins, and supervisor contact numbers are automatically unlocked once your reservation is <strong>Approved</strong> and you complete <strong>Check-In</strong>.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Booking & Eligibility Widget */}
        <div className="space-y-6">
          <Card className="border-navy-200 shadow-sm sticky top-20">
            <CardHeader className="pb-4 border-b border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reservation Specs
                </span>
                <span className="text-xs font-bold text-teal-700">
                  {resource.deposit_amount && resource.deposit_amount > 0 ? `Deposit: ₹${resource.deposit_amount}` : 'Free Access'}
                </span>
              </div>
              <CardTitle className="text-xl text-navy">Schedule Equipment</CardTitle>
            </CardHeader>

            <CardContent className="py-4 space-y-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-navy-400" /> Duration Limits:
                  </span>
                  <span className="font-medium text-navy">
                    {formatDurationMinutes(resource.min_duration_minutes)} - {formatDurationMinutes(resource.max_duration_minutes)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-navy-400" /> Cleaning Buffer:
                  </span>
                  <span className="font-medium text-navy">{resource.buffer_minutes} mins</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-navy-400" /> Advance Notice:
                  </span>
                  <span className="font-medium text-navy">Min {resource.min_notice_hours} hrs</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-navy-400" /> 30-Day Limit:
                  </span>
                  <span className="font-medium text-navy">{resource.max_rolling_hours_30d} hrs</span>
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="pt-4 border-t border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-navy text-xs flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-teal-600" /> Access Requirements
                  </h4>
                  {eligibility && (
                    <Badge
                      variant={eligibility.eligible ? 'success' : 'warning'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {eligibility.verificationStatus}
                    </Badge>
                  )}
                </div>

                {/* Missing Requirements Alert */}
                {eligibility && !eligibility.eligible && (
                  <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Requirements Not Satisfied</span>
                    </div>

                    <ul className="space-y-1.5 text-[11px] list-disc list-inside text-amber-900">
                      {eligibility.missing.map((m, i) => (
                        <li key={i} className="leading-snug">
                          <strong>{m.title}</strong>
                        </li>
                      ))}
                    </ul>

                    {/* Next Steps Buttons */}
                    <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                      <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">
                        Action required:
                      </p>
                      {resource.requirements?.map((req: any) => {
                        const isSatisfied = eligibility.satisfied.some((s) => s.title === req.title)
                        if (isSatisfied) return null

                        return (
                          <Button
                            key={req.id}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReqForUpload(req)
                              setTrainingDialogOpen(true)
                            }}
                            className="w-full justify-between h-8 text-xs bg-white hover:bg-amber-100 text-amber-900 border-amber-300 font-medium"
                          >
                            <span>Submit {req.title}</span>
                            <Upload className="h-3 w-3" />
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Satisfied Requirements List */}
                {eligibility && eligibility.satisfied.length > 0 && (
                  <div className="space-y-1.5">
                    {eligibility.satisfied.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-md border border-emerald-100"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{s.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-2">
              {eligibility?.eligible ? (
                <Button
                  onClick={() => setBookingDialogOpen(true)}
                  disabled={resource.status !== 'AVAILABLE'}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 shadow-xs"
                >
                  Request Access Now
                </Button>
              ) : (
                <Button
                  disabled
                  variant="outline"
                  className="w-full opacity-60 cursor-not-allowed text-xs h-10"
                >
                  Ineligible: Complete Requirements Above
                </Button>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                Conflict prevention enforced by Postgres exclusion constraints.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Booking Modal Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Equipment Slot</DialogTitle>
            <DialogDescription className="text-xs">
              {resource.title} • Operating hours: 08:00 - 20:00 (Asia/Kolkata)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2 text-xs">
            {bookingError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            {bookingSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-navy">Start Time (Date & Time)</label>
              <Input
                type="datetime-local"
                required
                className="h-9 text-xs"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">End Time (Date & Time)</label>
              <Input
                type="datetime-local"
                required
                className="h-9 text-xs"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Research / Project Purpose</label>
              <Textarea
                required
                rows={3}
                placeholder="State your project objectives, materials used, and research goal..."
                className="text-xs"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setBookingDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-navy hover:bg-navy-800 text-white">
                Submit Reservation Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit Training Modal Dialog */}
      <Dialog open={trainingDialogOpen} onOpenChange={setTrainingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Training Verification</DialogTitle>
            <DialogDescription className="text-xs">
              Upload certificate or workshop completion evidence for {selectedReqForUpload?.title}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTrainingSubmit} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-navy">Course / Certificate Name</label>
              <Input
                type="text"
                disabled
                value={selectedReqForUpload?.title || ''}
                className="h-9 text-xs bg-muted"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Certificate / Evidence Document URL</label>
              <Input
                type="url"
                required
                placeholder="https://shikhaoorg.edu/certs/my-safety-certificate.pdf"
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Enter your institutional badge or document link.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Notes for Facility Reviewer</label>
              <Textarea
                rows={2}
                placeholder="Completed safety workshop in FabLab session A, under Dr. Patel..."
                value={trainingNotes}
                onChange={(e) => setTrainingNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setTrainingDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={trainingSubmitting} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                {trainingSubmitting ? 'Submitting...' : 'Submit Evidence'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

