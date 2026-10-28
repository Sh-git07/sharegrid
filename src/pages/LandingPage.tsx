import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Printer,
  Cpu,
  Camera,
  Server,
  Wrench,
  Building,
  CheckCircle2,
  CalendarCheck,
  FileCheck,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { DemoLoginPanel } from '../components/DemoLoginPanel'

export function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/resources?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/resources')
    }
  }

  const categoryCards = [
    { name: '3D Printing & Prototyping', slug: '3d-printing', count: '1 Industrial Unit', icon: Printer, desc: 'FDM/SLA dual extrusion, composite materials' },
    { name: 'Electronics & Instrumentation', slug: 'electronics', count: '2 Lab Benches', icon: Cpu, desc: 'Mixed-signal oscilloscopes, soldering, cleanroom' },
    { name: 'Media & Audio-Visual Kit', slug: 'media-kit', count: '2 Cinema Kits', icon: Camera, desc: '4K mirrorless bodies, wireless audio, laser projection' },
    { name: 'High-Performance Computing', slug: 'computing', count: '1 GPU Node', icon: Server, desc: 'NVIDIA RTX 4090 24GB PyTorch AI rig' },
    { name: 'Precision Workshops & CNC', slug: 'cnc-workshops', count: '1 Supervised Mill', icon: Wrench, desc: 'Desktop 3-axis CNC milling, aluminum tooling' },
    { name: 'Seminar & Research Spaces', slug: 'spaces', count: '1 Acoustic Hall', icon: Building, desc: '80-seat auditorium with dual AV projection' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-navy-50/60 via-cream to-white border-b border-border/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="teal" className="px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              Shikha's Organisation
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-navy tracking-tight leading-tight">
              Access more. Own less. <br />
              <span className="text-teal-600">Share responsibly.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ShareGrid unlocks idle institutional equipment and research facilities. Book 3D printers, digital oscilloscopes, GPU clusters, and specialized labs with verified safety training and fair allocation.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search 3D printers, oscilloscopes, GPU nodes, rooms..."
                  className="pl-11 h-12 bg-white shadow-xs rounded-xl border-border text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 rounded-xl bg-navy hover:bg-navy-800 font-semibold gap-2 shadow-xs">
                Find Gear <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-teal-600" /> Mandatory Safety Verification</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-navy-500" /> Exclusion-Locked Scheduling</span>
              <span className="flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-emerald-600" /> Before/After Condition Audits</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Quick Start Banner */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-8 -mt-6 z-10">
        <DemoLoginPanel />
      </section>

      {/* Categories Grid */}
      <section className="py-16 container max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy">Campus Equipment Catalog</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse calibrated scientific instruments, prototyping tools, and research spaces.
            </p>
          </div>
          <Link to="/resources">
            <Button variant="outline" size="sm" className="gap-1.5 text-navy">
              View All Resources <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryCards.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                to={`/resources?category=${cat.slug}`}
                className="group rounded-xl border bg-card p-5 transition-all hover:border-teal-300 hover:shadow-md block"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-navy-50 group-hover:bg-teal-50 flex items-center justify-center text-navy-700 group-hover:text-teal-700 transition-colors shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy group-hover:text-teal-700 transition-colors text-base">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-teal-700 font-medium">{cat.count}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  {cat.desc}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <Badge variant="teal" className="bg-teal-500/20 text-teal-300 border-teal-500/30">
              Deterministic Workflow
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">How ShareGrid Works</h2>
            <p className="text-sm text-slate-300">
              Fair, transparent resource allocation with verifiable qualifications and condition accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Verify Eligibility', desc: 'Upload safety training certificates (e.g. SAFE-3D-101). Lab managers verify credentials before booking.' },
              { step: '02', title: 'Reserve a Slot', desc: 'Select operating hours. Database btree_gist exclusion constraints strictly prevent double-booking.' },
              { step: '03', title: 'Check In & Inspect', desc: 'Inspect equipment condition upon arrival. Complete the condition checklist and upload photo proof.' },
              { step: '04', title: 'Return & Log', desc: 'Submit return report. Lab owner verifies equipment state. Every transition is saved to an immutable audit trail.' },
            ].map((st) => (
              <div key={st.step} className="rounded-xl border border-navy-700 bg-navy-800/60 p-6 relative">
                <span className="text-3xl font-black text-teal-400 opacity-60 font-mono">{st.step}</span>
                <h3 className="text-base font-semibold text-white mt-2">{st.title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety Features */}
      <section className="py-16 container max-w-7xl mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy">Built For Institutional Trust</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Engineered from the database layer up with rigorous security, privacy isolation, and fair allocation policies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-navy text-base">Row-Level Security & Isolation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every table enforces granular RLS policies. Requesters only view their own records; sensitive locker codes and precise instructions remain hidden until check-in is authorized.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-navy text-base">Postgres Exclusion Constraints</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No race conditions. Active bookings use GiST index range checks with maintenance buffer windows. Overlapping approvals are physically rejected at the database engine level.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-navy text-base">Append-Only Audit Ledger</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All state transitions, manager reviews, and handovers append to immutable audit logs. UPDATE and DELETE privileges are permanently revoked across all roles.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}

