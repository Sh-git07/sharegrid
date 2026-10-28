import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Textarea } from '../components/ui/textarea'
import { formatDateTime } from '../lib/dates'
import {
  User,
  ShieldCheck,
  FileCheck,
  Building,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Save,
} from 'lucide-react'

export function ProfilePage() {
  const queryClient = useQueryClient()
  const { user, profile, roles, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [department, setDepartment] = useState(profile?.department || '')
  const [studentId, setStudentId] = useState(profile?.student_staff_id || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Upload Training Dialog
  const [uploadOpen, setUploadOpen] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [certUrl, setCertUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  // Fetch training records
  const { data: trainingRecords = [], isLoading: loadingTrainings } = useQuery({
    queryKey: ['my_training_records', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('training_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaveSuccess(false)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          department,
          student_staff_id: studentId,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      setSaveSuccess(true)
    } catch (err: any) {
      alert('Error updating profile: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setUploading(true)

    try {
      const { error } = await supabase.from('training_records').insert({
        user_id: user.id,
        course_name: courseName,
        course_code: courseCode.toUpperCase(),
        certificate_url: certUrl.trim() || 'https://sharegrid.demo/certs/user-evidence.pdf',
        verification_status: 'PENDING',
        is_demo: true,
      })

      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['my_training_records'] })
      setUploadOpen(false)
      setCourseName('')
      setCourseCode('')
      setCertUrl('')
    } catch (err: any) {
      alert('Upload error: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy tracking-tight">Institutional Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your verified campus credentials, departmental affiliation, and safety certifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <form onSubmit={handleSaveProfile}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-navy">Member Details</CardTitle>
                  <div className="flex gap-1">
                    {roles.map((r) => (
                      <Badge key={r} variant="teal" className="text-[10px]">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Connected to Shikha's Organisation directory
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {saveSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Profile saved successfully!</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-navy">Full Name</label>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-navy">Campus Email</label>
                    <Input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="h-9 text-xs bg-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-navy">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-navy">Department</label>
                    <Input
                      type="text"
                      placeholder="e.g. Mechanical Engineering"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-navy">Student / Staff ID</label>
                    <Input
                      type="text"
                      placeholder="SKO-2024-UG-042"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex justify-end">
                <Button type="submit" disabled={saving} size="sm" className="bg-navy hover:bg-navy-800 text-white gap-1 text-xs">
                  <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Training Records & Credentials */}
        <div className="space-y-6">
          <Card className="border-teal-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-navy flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Safety Qualifications
                </CardTitle>
                <Button
                  onClick={() => setUploadOpen(true)}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 border-teal-300 text-teal-800 hover:bg-teal-50 gap-1"
                >
                  <Upload className="h-3 w-3" /> Add
                </Button>
              </div>
              <CardDescription className="text-xs">
                Verified safety qualifications required for machine access
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              {loadingTrainings ? (
                <div className="space-y-2">
                  <div className="h-16 rounded-lg skeleton" />
                  <div className="h-16 rounded-lg skeleton" />
                </div>
              ) : trainingRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No certifications on file.</p>
              ) : (
                trainingRecords.map((t: any) => {
                  const isExpired = t.expires_at && new Date(t.expires_at) < new Date()

                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg border border-border bg-card space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy text-xs">{t.course_code}</span>
                        {isExpired ? (
                          <Badge variant="destructive" className="text-[10px]">
                            EXPIRED
                          </Badge>
                        ) : t.verification_status === 'VERIFIED' ? (
                          <Badge variant="success" className="text-[10px]">
                            VERIFIED
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">
                            PENDING
                          </Badge>
                        )}
                      </div>

                      <p className="font-semibold text-foreground text-xs">{t.course_name}</p>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>
                          {t.expires_at
                            ? `Expires: ${formatDateTime(t.expires_at, 'MMM dd, yyyy')}`
                            : 'No expiry'}
                        </span>
                        {t.certificate_url && (
                          <a
                            href={t.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-700 hover:underline flex items-center gap-0.5"
                          >
                            <ExternalLink className="h-3 w-3" /> Document
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Training / Qualification</DialogTitle>
            <DialogDescription className="text-xs">
              Submit proof of completion for lab safety certification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadCertificate} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-navy">Course / Module Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. 3D Printer Safety & Operation"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Course Code</label>
              <Input
                type="text"
                required
                placeholder="e.g. SAFE-3D-101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Certificate Document URL</label>
              <Input
                type="url"
                required
                placeholder="https://shikhaoorg.edu/certs/my-doc.pdf"
                value={certUrl}
                onChange={(e) => setCertUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                {uploading ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


