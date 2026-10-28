import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Clock,
  Calendar,
  ShieldAlert,
  FileCheck,
  TrendingUp,
  Activity,
} from 'lucide-react'

export function DashboardPage() {
  const { user, profile, roles } = useAuth()

  // Fetch KPI data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard_metrics', user?.id],
    queryFn: async () => {
      // 1. Total usage hours
      const { data: usage } = await supabase.from('usage_records').select('duration_hours')
      const totalHours = (usage || []).reduce((acc, c) => acc + Number(c.duration_hours || 0), 0)

      // 2. Active Bookings
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('id, status')
        .in('status', ['APPROVED', 'CHECKED_IN', 'RETURN_PENDING_INSPECTION'])

      // 3. Open Incidents
      const { data: openIncidents } = await supabase
        .from('incidents')
        .select('id')
        .neq('status', 'RESOLVED')

      // 4. Verified Training
      const { data: verifiedTrainings } = await supabase
        .from('training_records')
        .select('id')
        .eq('verification_status', 'VERIFIED')

      // 5. Category breakdown
      const { data: catData } = await supabase.from('categories').select('id, name')
      const { data: usageWithCat } = await supabase.from('usage_records').select('duration_hours, category_id')

      const categoryUsage = (catData || []).map((cat: any) => {
        const hours = (usageWithCat || [])
          .filter((u: any) => u.category_id === cat.id)
          .reduce((sum, u) => sum + Number(u.duration_hours || 0), 0)
        return {
          name: cat.name.split(' ')[0], // short name
          fullName: cat.name,
          hours: Math.round(hours * 10) / 10,
        }
      })

      // 6. Booking status distribution
      const { data: allBookings } = await supabase.from('bookings').select('status')
      const statusCounts: Record<string, number> = {}
      ;(allBookings || []).forEach((b: any) => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
      })

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
      }))

      return {
        totalHours: Math.round(totalHours * 10) / 10,
        activeCount: activeBookings?.length || 0,
        incidentCount: openIncidents?.length || 0,
        verifiedCount: verifiedTrainings?.length || 0,
        categoryUsage,
        statusData,
      }
    },
  })

  const COLORS = ['#1e3a5f', '#14b8a6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy tracking-tight">Facility Analytics & Utilization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live campus utilization metrics, booking cycle distribution, and safety audit health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recorded Utilization
            </span>
            <div className="h-8 w-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy mt-2">
            {isLoading ? '...' : `${stats?.totalHours || 0} hrs`}
          </p>
          <span className="text-[11px] text-teal-700 font-medium">30-day rolling campus window</span>
        </Card>

        <Card className="p-5 border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Sessions
            </span>
            <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-700 mt-2">
            {isLoading ? '...' : stats?.activeCount || 0}
          </p>
          <span className="text-[11px] text-muted-foreground">Approved or checked-in now</span>
        </Card>

        <Card className="p-5 border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Verified Qualifications
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">
            {isLoading ? '...' : stats?.verifiedCount || 0}
          </p>
          <span className="text-[11px] text-muted-foreground">Active safety credentials</span>
        </Card>

        <Card className="p-5 border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Open Incidents
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-700 mt-2">
            {isLoading ? '...' : stats?.incidentCount || 0}
          </p>
          <span className="text-[11px] text-muted-foreground">Under review by lab manager</span>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Utilization Bar Chart */}
        <Card className="p-5 border-border">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base text-navy flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-600" /> Equipment Hours by Lab Domain
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.categoryUsage || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} hrs`, 'Usage']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="p-5 border-border">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base text-navy flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" /> Booking Cycle Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.statusData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(stats?.statusData || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
