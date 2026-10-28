import React from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ShieldCheck, Heart, Grid, Users, Clock } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <Badge variant="teal" className="text-xs uppercase">Institutional Resource Infrastructure</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy">About ShareGrid PSIT</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Access more. Own less. Share responsibly.
        </p>
      </div>

      <Card className="p-8 space-y-6 border-border leading-relaxed text-sm text-foreground/90">
        <div>
          <h2 className="text-lg font-bold text-navy mb-2">The Campus Challenge</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Higher education and research institutions invest millions in high-precision additive manufacturing, oscilloscopes, GPU deep learning clusters, and cleanroom prototyping spaces. However, equipment utilization often remains below 35%, while students, young researchers, and early-stage startup incubators struggle with prohibitive access barriers.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy mb-2">Our High-Trust Sharing Solution</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ShareGrid is designed specifically for academic and research institutions. Instead of relying on informal keys or ad-hoc spreadsheets, ShareGrid enforces explicit safety requirements, pre-calibrated cleaning buffers, physical condition reports with photo evidence, and deterministic conflict prevention.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="space-y-1">
            <h3 className="font-semibold text-navy text-xs flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Mandatory Safety Gate
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Equipment is unlocked only after faculty managers verify prerequisite safety workshops.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-navy text-xs flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-navy-600" /> Zero Race Conditions
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Postgres exclusion constraints eliminate double bookings and enforce maintenance buffers.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-navy text-xs flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" /> Fair Allocation
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Rolling 30-day usage caps prevent monopolization and guarantee democratic campus access.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
