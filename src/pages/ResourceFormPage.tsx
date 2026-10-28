import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { ArrowLeft, Save, Sparkles, AlertCircle } from 'lucide-react'

export function ResourceFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, profile, isAdmin } = useAuth()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [resourceType, setResourceType] = useState('EQUIPMENT')
  const [locationName, setLocationName] = useState('')
  const [locationDetails, setLocationDetails] = useState('')
  const [minDuration, setMinDuration] = useState(60)
  const [maxDuration, setMaxDuration] = useState(480)
  const [bufferMinutes, setBufferMinutes] = useState(30)
  const [minNoticeHours, setMinNoticeHours] = useState(2)
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14)
  const [rules, setRules] = useState('')
  const [cancellationPolicy, setCancellationPolicy] = useState('')
  const [depositAmount, setDepositAmount] = useState(0)
  const [requiresSupervision, setRequiresSupervision] = useState(false)
  const [status, setStatus] = useState('AVAILABLE')
  const [imageUrl, setImageUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return data || []
    },
  })

  // If editing, load resource
  const { data: existingResource } = useQuery({
    queryKey: ['edit_resource', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('resources').select('*, images:resource_images(*)').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: isEditing,
  })

  useEffect(() => {
    if (existingResource) {
      setTitle(existingResource.title)
      setDescription(existingResource.description)
      setCategoryId(existingResource.category_id || '')
      setResourceType(existingResource.resource_type)
      setLocationName(existingResource.location_name)
      setLocationDetails(existingResource.location_details || '')
      setMinDuration(existingResource.min_duration_minutes)
      setMaxDuration(existingResource.max_duration_minutes)
      setBufferMinutes(existingResource.buffer_minutes)
      setMinNoticeHours(existingResource.min_notice_hours)
      setMaxAdvanceDays(existingResource.max_advance_days)
      setRules(existingResource.rules || '')
      setCancellationPolicy(existingResource.cancellation_policy || '')
      setDepositAmount(Number(existingResource.deposit_amount || 0))
      setRequiresSupervision(existingResource.requires_supervision)
      setStatus(existingResource.status)
      const primary = existingResource.images?.find((img: any) => img.is_primary)?.url || existingResource.images?.[0]?.url
      if (primary) setImageUrl(primary)
    }
  }, [existingResource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    if (!user) {
      navigate('/login')
      return
    }

    try {
      const payload: any = {
        title,
        description,
        category_id: categoryId || null,
        resource_type: resourceType,
        location_name: locationName,
        location_details: locationDetails,
        min_duration_minutes: Number(minDuration),
        max_duration_minutes: Number(maxDuration),
        buffer_minutes: Number(bufferMinutes),
        min_notice_hours: Number(minNoticeHours),
        max_advance_days: Number(maxAdvanceDays),
        rules,
        cancellation_policy: cancellationPolicy,
        deposit_amount: Number(depositAmount),
        requires_supervision: requiresSupervision,
        status,
        owner_id: isEditing ? existingResource?.owner_id : user.id,
        is_published: true,
        is_exclusive: true,
      }

      let savedId = id
      if (isEditing) {
        const { error } = await supabase.from('resources').update(payload).eq('id', id!)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('resources').insert(payload).select().single()
        if (error) throw error
        savedId = data.id
      }

      // If image URL provided, upsert resource image
      if (imageUrl.trim() && savedId) {
        await supabase.from('resource_images').upsert({
          resource_id: savedId,
          url: imageUrl.trim(),
          is_primary: true,
        }, { onConflict: 'resource_id,url' })
      }

      queryClient.invalidateQueries({ queryKey: ['resources'] })
      navigate(`/resources/${savedId}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save resource')
    } finally {
      setLoading(false)
    }
  }

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

      <div>
        <h1 className="text-2xl font-bold text-navy">
          {isEditing ? 'Edit Campus Resource' : 'List New Campus Equipment / Space'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure operating hours, safety requirements, buffer duration, and privacy rules.
        </p>
      </div>

      <Card className="border-border shadow-xs">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base">Resource Details</CardTitle>
            <CardDescription className="text-xs">
              Provide complete specifications for student and researcher discovery
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-navy">Title / Equipment Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. Formlabs Form 3+ SLA 3D Printer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-navy">Category</label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy">Resource Type</label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Resource Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EQUIPMENT">EQUIPMENT</SelectItem>
                    <SelectItem value="SPACE">SPACE / ROOM</SelectItem>
                    <SelectItem value="TOOL">TOOL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">Detailed Description</label>
              <Textarea
                rows={4}
                required
                placeholder="Include build volumes, precision specs, compatible materials, or AV gear..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-navy">Public Location Name</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Block Room 204"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy">Image URL (Unsplash or direct URL)</label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-navy">
                Private Access Instructions (Hidden until Check-in)
              </label>
              <Textarea
                rows={2}
                placeholder="Locker combinations, keycard protocol, supervisor phone extension..."
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <label className="font-semibold text-navy">Min Mins</label>
                <Input
                  type="number"
                  min={15}
                  value={minDuration}
                  onChange={(e) => setMinDuration(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-navy">Max Mins</label>
                <Input
                  type="number"
                  min={15}
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-navy">Buffer Mins</label>
                <Input
                  type="number"
                  min={0}
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-navy">Min Notice (hrs)</label>
                <Input
                  type="number"
                  min={0}
                  value={minNoticeHours}
                  onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-navy">Usage Rules</label>
                <Input
                  type="text"
                  placeholder="Safety glasses mandatory; clean bed post print"
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy">Cancellation Policy</label>
                <Input
                  type="text"
                  placeholder="Cancel 2 hours prior"
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-navy">
                <input
                  type="checkbox"
                  checked={requiresSupervision}
                  onChange={(e) => setRequiresSupervision(e.target.checked)}
                  className="rounded border-border text-navy h-4 w-4"
                />
                Requires Lab Manager Supervision
              </label>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="sm" className="bg-navy hover:bg-navy-800 text-white gap-1.5">
              <Save className="h-3.5 w-3.5" /> {loading ? 'Saving...' : 'Save & Publish'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
