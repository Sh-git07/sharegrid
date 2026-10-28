import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Textarea } from '../components/ui/textarea'
import { formatDateTime } from '../lib/dates'
import {
  ShieldCheck,
  Users,
  FileCheck,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertTriangle,
  Building,
} from 'lucide-react'

export function AdminPage() {
  const queryClient = useQueryClient()
  const { user, profile, isAdmin, isManager } = useAuth()

  const [activeTab, setActiveTab] = useState('verification')
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [reviewNotes, setReviewNotes] = useState('Safety certificate verified against institutional training records.')
  const [actionLoading, setActionLoading] = useState(false)
  const [resettingDemo, setResettingDemo] = useState(false)
  const [auditPage, setAuditPage] = useState(0)

  // 1. Fetch Verification Queue (Pending Training Records)
  const { data: pendingTrainings = [], isLoading: loadingTrainings } = useQuery({
    queryKey: ['admin_verification_queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_records')
        .select(`
          *,
          user:profiles!training_records_user_id_fkey(id, full_name, email, department, student_staff_id)
        `)
        .eq('verification_status', 'PENDING')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  // 2. Fetch Users and Roles
  const { data: usersList = [] } = useQuery({
    queryKey: ['admin_users_list'],
    queryFn: async () => {
      const { data: profilesData } = await supabase.from('profiles').select('*').order('full_name')
      const { data: rolesData } = await supabase.from('user_roles').select('*')

      return (profilesData || []).map((p: any) => ({
        ...p,
        roles: rolesData ? rolesData.filter((r) => r.user_id === p.id).map((r) => r.role) : [],
      }))
    },
    enabled: activeTab === 'users' || isAdmin,
  })

  // 3. Fetch Audit Logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin_audit_logs', auditPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, actor:profiles(full_name)')
        .order('created_at', { ascending: false })
        .range(auditPage * 20, (auditPage + 1) * 20 - 1)

      if (error) throw error
      return data || []
    },
    enabled: activeTab === 'audit',
  })

  // 4. Verification Action (Approve / Reject)
  const handleVerify = async (decision: 'VERIFIED' | 'REJECTED') => {
    if (!selectedRecord || !user) return
    setActionLoading(true)

    try {
      // 1. Update training record
      const { error: trainErr } = await supabase
        .from('training_records')
        .update({
          verification_status: decision,
          reviewer_notes: reviewNotes,
          reviewer_id: user.id,
          expires_at: decision === 'VERIFIED' ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRecord.id)

      if (trainErr) throw trainErr

      // 2. Insert into eligibility_reviews
      await supabase.from('eligibility_reviews').insert({
        user_id: selectedRecord.user_id,
        reviewer_id: user.id,
        training_record_id: selectedRecord.id,
        decision: decision === 'VERIFIED' ? 'APPROVED' : 'REJECTED',
        notes: reviewNotes,
      })

      // 3. Create notification for user
      await supabase.from('notifications').insert({
        recipient_id: selectedRecord.user_id,
        title: `Training Qualification ${decision === 'VERIFIED' ? 'Approved' : 'Rejected'}`,
        message: `Your training certificate for ${selectedRecord.course_name} (${selectedRecord.course_code}) was ${decision.toLowerCase()} by lab management.`,
        type: 'VERIFICATION_RESULT',
        entity_type: 'verification',
      })

      // 4. Create audit log
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'VERIFY_TRAINING',
        entity_type: 'training_record',
        entity_id: selectedRecord.id,
        explanation: `Manager ${profile?.full_name || 'Staff'} set ${selectedRecord.course_code} status to ${decision}`,
      })

      queryClient.invalidateQueries({ queryKey: ['admin_verification_queue'] })
      queryClient.invalidateQueries({ queryKey: ['my_training_records'] })
      setSelectedRecord(null)
    } catch (err: any) {
      alert('Verification error: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Demo Reset Action
  const handleResetDemo = async () => {
    if (!confirm('Reset demo transactions and reload seed state?')) return
    setResettingDemo(true)
    try {
      // Clear transactional demo rows
      await supabase.from('incident_updates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('condition_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('training_records').delete().eq('course_code', 'SAFE-3D-101') // reset 3D printer training so scenario can replay!

      alert('Demo state reset successfully!')
      queryClient.invalidateQueries()
    } catch (err: any) {
      alert('Demo reset error: ' + err.message)
    } finally {
      setResettingDemo(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">
            Institutional Administration & Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shikha's Organisation • Safety verification queue, user permissions, and compliance ledger.
          </p>
        </div>

        <Button
          onClick={handleResetDemo}
          disabled={resettingDemo}
          variant="outline"
          size="sm"
          className="text-xs text-navy border-navy-200 hover:bg-navy-50 gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${resettingDemo ? 'animate-spin' : ''}`} />
          {resettingDemo ? 'Resetting...' : 'Reset Demo State'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="verification" className="text-xs gap-1.5">
            <FileCheck className="h-4 w-4" />
            Verification Queue ({pendingTrainings.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1.5">
            <Users className="h-4 w-4" />
            Users & Roles
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Audit Ledger
          </TabsTrigger>
        </TabsList>

        {/* 1. Verification Queue */}
        <TabsContent value="verification" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy">
              Pending Safety Evidence Submissions
            </h2>
            <span className="text-xs text-muted-foreground">
              {pendingTrainings.length} awaiting lab manager sign-off
            </span>
          </div>

          {loadingTrainings ? (
            <div className="h-40 rounded-xl border skeleton" />
          ) : pendingTrainings.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              All submitted qualifications have been reviewed! No items pending.
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingTrainings.map((rec: any) => (
                <Card key={rec.id} className="p-5 border-border hover:border-navy-200 transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="warning" className="text-[10px]">PENDING VERIFICATION</Badge>
                        <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {rec.course_code}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Submitted {formatDateTime(rec.created_at)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-navy text-base mt-1">{rec.course_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Candidate: <strong className="text-navy">{rec.user?.full_name}</strong> ({rec.user?.department || 'Student'}) • ID: {rec.user?.student_staff_id || 'N/A'}
                      </p>
                      {rec.certificate_url && (
                        <div className="pt-1">
                          <a
                            href={rec.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline font-medium"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View Certificate Document
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        onClick={() => setSelectedRecord(rec)}
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Review & Approve
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 2. Users & Roles */}
        <TabsContent value="users" className="space-y-4">
          <h2 className="text-base font-bold text-navy">Campus Members & RBAC Roles</h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-navy font-semibold">
                  <tr>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Campus Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Assigned Roles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {usersList.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-navy">{u.full_name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3 text-muted-foreground">{u.department || 'General'}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r: string) => (
                            <Badge
                              key={r}
                              variant={r === 'ADMIN' ? 'destructive' : r === 'MANAGER' ? 'teal' : 'secondary'}
                              className="text-[10px] uppercase font-bold"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* 3. Audit Ledger */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy">Immutable Security & Workflow Audit Ledger</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={auditPage === 0}
                onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {auditPage + 1}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={auditLogs.length < 20}
                onClick={() => setAuditPage((p) => p + 1)}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="p-3.5 rounded-lg border bg-card text-xs space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">{log.action}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{log.entity_type}</Badge>
                  </div>
                  <span>{formatDateTime(log.created_at)}</span>
                </div>
                <p className="text-foreground/90">{log.explanation}</p>
                {log.actor?.full_name && (
                  <p className="text-[11px] text-muted-foreground">Actor: {log.actor.full_name}</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Safety Qualification</DialogTitle>
            <DialogDescription className="text-xs">
              Candidate: {selectedRecord?.user?.full_name} • Course: {selectedRecord?.course_code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-navy">Manager Evaluation Notes</label>
              <Textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2 flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleVerify('REJECTED')}
                disabled={actionLoading}
                className="text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Reject Evidence
              </Button>
              <Button
                type="button"
                onClick={() => handleVerify('VERIFIED')}
                disabled={actionLoading}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                {actionLoading ? 'Saving...' : 'Grant & Verify Qualification'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

