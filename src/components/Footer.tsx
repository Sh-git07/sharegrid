import React from 'react'
import { Link } from 'react-router-dom'
import { Grid, ShieldCheck, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-navy flex items-center justify-center text-white">
                <Grid className="h-4 w-4" />
              </div>
              <span className="font-bold text-navy tracking-tight">ShareGrid</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Access more. Own less. Share responsibly. High-trust campus equipment sharing for Pranveer Singh Institute of Technology.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-navy uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="/resources" className="hover:text-navy transition-colors">Equipment Catalog</Link></li>
              <li><Link to="/resources?category=3d-printing" className="hover:text-navy transition-colors">3D Printers</Link></li>
              <li><Link to="/resources?category=electronics" className="hover:text-navy transition-colors">Electronics Workstations</Link></li>
              <li><Link to="/resources?category=computing" className="hover:text-navy transition-colors">GPU Rigs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-navy uppercase tracking-wider mb-3">Governance</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="/about" className="hover:text-navy transition-colors">About ShareGrid</Link></li>
              <li><Link to="/privacy" className="hover:text-navy transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-navy transition-colors">Terms of Equipment Use</Link></li>
              <li><Link to="/incidents" className="hover:text-navy transition-colors">Incident Escalation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-navy uppercase tracking-wider mb-3">Institution Trust</h4>
            <div className="rounded-lg bg-cream border border-border p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-navy">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> Verified PSIT Facility
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Strict condition tracking, manager verification, deterministic conflict prevention, and immutable audit logs.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} ShareGrid. Pranveer Singh Institute of Technology.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Engineered for fair campus access <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  )
}
