import { PageContainer } from '../components/PageContainer'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { formatDateTime, formatDurationMinutes } from '../lib/dates'
import { Calendar, Clock, MapPin, ArrowRight, ShieldCheck } from 'lucide-react'

export function BookingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED'>('ALL')

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my_bookings', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          resource:resources(id, title, location_name, images:resource_images(url, is_primary), category:categories(name))
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const filteredBookings = bookings.filter((b: any) => {
    if (activeTab === 'ACTIVE') {
      return ['APPROVED', 'CHECKED_IN', 'RETURN_PENDING_INSPECTION'].includes(b.status)
    }
    if (activeTab === 'PENDING') {
      return ['PENDING_APPROVAL', 'WAITLISTED'].includes(b.status)
    }
    if (activeTab === 'COMPLETED') {
      return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)
    }
    return true
  })

  return (
    <PageContainer
      title="My Reservations"
      description="Track reservation approvals, check in to active slots, and submit return condition checklists."
      action={
        <Link to="/resources">
          <Button size="sm" className="bg-navy hover:bg-navy-800 text-white font-medium text-xs">
            Browse More Equipment
          </Button>
        </Link>
      }
    >

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 text-xs">
        {[
          { key: 'ALL', label: 'All Bookings' },
          { key: 'ACTIVE', label: 'Active & Approved' },
          { key: 'PENDING', label: 'Pending Review' },
          { key: 'COMPLETED', label: 'Completed & History' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-navy text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border skeleton" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No reservations found"
          description={
            activeTab === 'ALL'
              ? "You haven't requested any campus equipment yet. Browse the marketplace to book 3D printers, oscilloscopes, or GPU nodes."
              : `No bookings found in ${activeTab.toLowerCase()} status.`
          }
          actionLabel="Go to Marketplace"
          onAction={() => (window.location.href = '/resources')}
        />
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b: any) => {
            const primaryImg =
              b.resource?.images?.find((img: any) => img.is_primary)?.url ||
              b.resource?.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'

            return (
              <Link
                key={b.id}
                to={`/bookings/${b.id}`}
                className="block group rounded-xl border bg-card hover:border-navy-300 hover:shadow-xs transition-all p-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={primaryImg}
                      alt={b.resource?.title}
                      className="h-16 w-20 rounded-lg object-cover bg-muted shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {b.resource?.category?.name || 'Equipment'}
                        </span>
                        <span className="text-border">•</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <h3 className="font-semibold text-navy text-base mt-0.5 group-hover:text-teal-700 transition-colors">
                        {b.resource?.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        Purpose: {b.purpose}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto text-xs text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                    <span className="font-semibold text-navy flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      {formatDateTime(b.start_time, 'MMM dd, hh:mm a')}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      until {formatDateTime(b.end_time, 'hh:mm a')}
                    </span>
                    <span className="text-xs font-medium text-teal-700 group-hover:underline flex items-center gap-1 mt-1">
                      View Timeline <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
