import { PageContainer } from '../components/PageContainer'
import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ResourceCard } from '../components/ResourceCard'
import { EmptyState } from '../components/EmptyState'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Search, Filter, SlidersHorizontal, X, Sparkles } from 'lucide-react'

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialSearch = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || 'ALL'

  const [search, setSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('relevance')

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) throw error
      return data || []
    },
  })

  // Fetch Resources with Images and Owner
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          category:categories(id, name, slug),
          images:resource_images(url, is_primary),
          owner:profiles!resources_owner_id_fkey(full_name),
          requirements:resource_requirements(requirement_type, title)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  // Filter & Sort Logic
  const filteredResources = useMemo(() => {
    return resources
      .filter((item: any) => {
        // Search filter (title, description, location)
        if (search.trim()) {
          const q = search.toLowerCase()
          const matchTitle = item.title.toLowerCase().includes(q)
          const matchDesc = item.description?.toLowerCase().includes(q)
          const matchLoc = item.location_name.toLowerCase().includes(q)
          const matchCat = item.category?.name?.toLowerCase().includes(q)
          if (!matchTitle && !matchDesc && !matchLoc && !matchCat) return false
        }

        // Category filter
        if (selectedCategory !== 'ALL') {
          if (item.category?.slug !== selectedCategory && item.category?.id !== selectedCategory) {
            return false
          }
        }

        // Status filter
        if (selectedStatus !== 'ALL') {
          if (item.status !== selectedStatus) return false
        }

        // Type filter
        if (selectedType !== 'ALL') {
          if (item.resource_type !== selectedType) return false
        }

        return true
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title)
        }
        if (sortBy === 'available') {
          if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1
          if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1
        }
        if (sortBy === 'deposit') {
          return (a.deposit_amount || 0) - (b.deposit_amount || 0)
        }
        return 0 // relevance / default created order
      })
  }, [resources, search, selectedCategory, selectedStatus, selectedType, sortBy])

  const resetFilters = () => {
    setSearch('')
    setSelectedCategory('ALL')
    setSelectedStatus('ALL')
    setSelectedType('ALL')
    setSortBy('relevance')
    setSearchParams({})
  }

  const hasActiveFilters = search || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL'

  return (
    <PageContainer
      title="Campus Resource Marketplace"
      description="Discover and reserve specialized engineering, media, prototyping, and scientific facilities."
      action={
        <span className="text-xs font-medium text-navy bg-navy-50 px-3 py-1.5 rounded-full border border-navy-200">
          {filteredResources.length} {filteredResources.length === 1 ? 'Resource' : 'Resources'} Available
        </span>
      }
    >

      {/* Filter and Search Bar */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search equipment, labs, 3D printers, locations..."
              className="pl-9 text-xs h-9 bg-background"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSearchParams((prev) => {
                  if (e.target.value) prev.set('q', e.target.value)
                  else prev.delete('q')
                  return prev
                })
              }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  setSearchParams((prev) => {
                    prev.delete('q')
                    return prev
                  })
                }}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Select */}
          <div>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val)
                setSearchParams((prev) => {
                  if (val !== 'ALL') prev.set('category', val)
                  else prev.delete('category')
                  return prev
                })
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort: Most Relevant</SelectItem>
                <SelectItem value="available">Sort: Available First</SelectItem>
                <SelectItem value="title">Sort: Alphabetical (A-Z)</SelectItem>
                <SelectItem value="deposit">Sort: Lowest Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Filter className="h-3 w-3" /> Quick Filter:
            </span>

            {/* Status pills */}
            {['ALL', 'AVAILABLE', 'RESTRICTED', 'MAINTENANCE'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedStatus === st
                    ? 'bg-navy-700 text-white'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-navy'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
              </button>
            ))}

            {/* Type pills */}
            <span className="text-border mx-1">|</span>
            {['ALL', 'EQUIPMENT', 'SPACE'].map((tp) => (
              <button
                key={tp}
                onClick={() => setSelectedType(tp)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedType === tp
                    ? 'bg-teal-700 text-white'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-navy'
                }`}
              >
                {tp === 'ALL' ? 'All Types' : tp}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="ghost"
              size="sm"
              className="text-xs text-rose-700 hover:bg-rose-50 h-7 px-2.5 gap-1"
            >
              <X className="h-3 w-3" /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Resources */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-xl border skeleton" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <EmptyState
          title="No resources match your search"
          description="Try broadening your keywords or removing some filters to explore other campus equipment."
          actionLabel="Clear all filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((item: any) => {
            const primaryImg = item.images?.find((img: any) => img.is_primary)?.url || item.images?.[0]?.url
            return (
              <ResourceCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                categoryName={item.category?.name}
                locationName={item.location_name}
                status={item.status}
                imageUrl={primaryImg}
                ownerName={item.owner?.full_name}
                minDurationMinutes={item.min_duration_minutes}
                maxDurationMinutes={item.max_duration_minutes}
                requiresSupervision={item.requires_supervision}
                depositAmount={item.deposit_amount}
              />
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
